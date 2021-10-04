
// B+ tree is an m-ary tree with a variable but often large number of children per node.
// A B+ tree consists of a root, internal nodes and leaves.
// The root may be either a leaf or a node with two or more children

import TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import { BNode, BNodeInternal, EditRangeResult } from './BTreeNode.js'

function iterator<T>(next: () => Promise<IteratorResult<T>> = (async () => ({ done:true, value:undefined }))): IterableIterator<T> {
    let result: any = { next }
    if (Symbol && Symbol.iterator) {
        result[Symbol.iterator] = function() {
            return this
        }
    }
    return result
}


export default class BTree<K, V> {
    id: number
    root: number
    size: number = 0
    compare: Comparator<K>
    maxNodeSize: number
    txState: TransactionCollection

    constructor(txState: TransactionCollection, id: number, root: number, size: number, maxNodeSize?: number, compare?: Comparator<K>) {
        this.txState = txState
        this.id = id
        this.size = size
        this.root = root
        this.maxNodeSize = maxNodeSize! >= 2 ? Math.min(maxNodeSize!, 256) : 32
        this.compare = compare ?? function (a: K, b: K) {
            return a > b ? 1 : a < b ? -1 : 0
        }
    }

    async getRoot(): Promise<BNode<K, V> | BNodeInternal<K, V>> {
        if(!this.root) {
            this.root = (await EmptyLeaf(this.txState) as BNode<K, V>).id
            await this.txState.index.setAsModified(this.id)
        }
        return await this.txState.bnode.getOrInstantiate(this.root) as BNode<K, V> | BNodeInternal<K, V>
    }


    get length(): number {
        return this.size
    }

    get isEmpty(): boolean {
        return this.size === 0
    }

    async forEach(callback: (v:V, k:K, tree:BTree<K,V>) => void, thisArg?: any): Promise<number>;

    /** Runs a function for each key-value pair, in order from smallest to
     *  largest key. For compatibility with ES6 Map, the argument order to
     *  the callback is backwards: value first, then key. Call forEachPair
     *  instead to receive the key as the first argument.
     * @param thisArg If provided, this parameter is assigned as the `this`
     *        value for each callback.
     * @returns the number of values that were sent to the callback,
     *        or the R value if the callback returned {break:R}. */
    async forEach<R = number>(callback: (v: V, k: K, tree: BTree<K, V>) => { break?: R } | void, thisArg?: any): Promise<number | R> {
        if (thisArg !== undefined)
            callback = callback.bind(thisArg)
        return await this.forEachPair((k, v) => callback(v, k, this))
    }

    /** Runs a function for each key-value pair, in order from smallest to
     *  largest key. The callback can return {break:R} (where R is any value
     *  except undefined) to stop immediately and return R from forEachPair.
     * @param onFound A function that is called for each key-value pair. This
     *        function can return {break:R} to stop early with result R.
     *        The reason that you must return {break:R} instead of simply R
     *        itself is for consistency with editRange(), which allows
     *        multiple actions, not just breaking.
     * @param initialCounter This is the value of the third argument of
     *        `onFound` the first time it is called. The counter increases
     *        by one each time `onFound` is called. Default value: 0
     * @returns the number of pairs sent to the callback (plus initialCounter,
     *        if you provided one). If the callback returned {break:R} then
     *        the R value is returned instead. */
    async forEachPair<R = number>(callback: (k: K, v: V, counter: number) => { break?: R } | void, initialCounter?: number): Promise<number | R> {
        let low = await this.minKey()
        let high = await this.maxKey()
        return await this.forRange(low!, high!, true, callback, initialCounter)
    }
    /**
     * Finds a pair in the tree and returns the associated value.
     * @param defaultValue a value to return if the key was not found.
     * @returns the value, or defaultValue if the key was not found.
     * @description Computational complexity: O(log size)
     */
    async get(key: K): Promise<V | undefined> {
        return (await this.getRoot()).get(key, this)
    }

    /**
     * Adds or overwrites a key-value pair in the B+ tree.
     * @param key the key is used to determine the sort order of
     *        data in the tree.
     * @param value data to associate with the key (optional)
     * @param overwrite Whether to overwrite an existing key-value pair
     *        (default: true). If this is false and there is an existing
     *        key-value pair then this method has no effect.
     * @returns true if a new key-value pair was added.
     * @description Computational complexity: O(log size)
     * Note: when overwriting a previous entry, the key is updated
     * as well as the value. This has no effect unless the new key
     * has data that does not affect its sort order.
     */
    async set(key: K, value: V, overwrite?: boolean): Promise<boolean> {
        let currentRoot = await this.getRoot()

        let result = await currentRoot.set(key, value, overwrite , this)
        if (result === true || result === false)
            return result
        // Root node has split, so create a new root node.
        let id = await this.txState.bnode.allocateID()
        let root = new BNodeInternal<K, V>(this.txState, id, [this.root, result.id], [await currentRoot.maxKey(), await result.maxKey()])
        await this.txState.bnode.setInstance(id, root)

        this.root = id
        await this.txState.index.setAsModified(id)

        return true
    }

    /**
     * Returns true if the key exists in the B+ tree, false if not.
     * Use get() for best performance; use has() if you need to
     * distinguish between "undefined value" and "key not present".
     * @param key Key to detect
     * @description Computational complexity: O(log size)
     */
    async has(key: K): Promise<boolean> {
        return await this.forRange(key, key, true, undefined) !== 0
    }

    /**
     * Removes a single key-value pair from the B+ tree.
     * @param key Key to find
     * @returns true if a pair was found and removed, false otherwise.
     * @description Computational complexity: O(log size)
     */
    async delete(key: K): Promise<boolean> {
        return await this.editRange(key, key, true, DeleteRange) !== 0
    }

    // /////////////////////////////////////////////////////////////////////////////
    // // Clone-mutators ///////////////////////////////////////////////////////////

    // /** Returns a copy of the tree with the specified key set (the value is undefined). */
    // async with(key: K): Promise<BTree<K, V | undefined>>
    // /** Returns a copy of the tree with the specified key-value pair set. */
    // async with<V2>(key: K, value: V2, overwrite?: boolean): Promise<BTree<K, V | V2>>
    // async with<V2>(key: K, value?: V2, overwrite?: boolean): Promise<BTree<K, V | V2 | undefined>> {
    //     let nu = await this.clone() as BTree<K, V | V2 | undefined>
    //     return await nu.set(key, value, overwrite) || overwrite ? nu : this
    // }

    // /** Returns a copy of the tree with the specified key-value pairs set. */
    // async withPairs<V2>(pairs: [K, V | V2][], overwrite: boolean): Promise<BTree<K, V | V2>> {
    //     let nu = this.clone() as BTree<K, V | V2>
    //     return nu.setPairs(pairs, overwrite) !== 0 || overwrite ? nu : this
    // }

    // /** Returns a copy of the tree with the specified keys present.
    //  *  @param keys The keys to add. If a key is already present in the tree,
    //  *         neither the existing key nor the existing value is modified.
    //  *  @param returnThisIfUnchanged if true, returns this if all keys already
    //  *  existed. Performance note: due to the architecture of this class, all
    //  *  node(s) leading to existing keys are cloned even if the collection is
    //  *  ultimately unchanged.
    // */
    // async withKeys(keys: K[], returnThisIfUnchanged?: boolean): Promise<BTree<K, V | undefined>> {
    //     let nu = await this.clone() as BTree<K, V | undefined>
    //     let changed = false
    //     for (let i = 0; i < keys.length; i++)
    //         changed = await nu.set(keys[i], undefined, false) || changed
    //     return returnThisIfUnchanged && !changed ? this : nu
    // }

    // /** Returns a copy of the tree with the specified key removed.
    //  * @param returnThisIfUnchanged if true, returns this if the key didn't exist.
    //  *  Performance note: due to the architecture of this class, node(s) leading
    //  *  to where the key would have been stored are cloned even when the key
    //  *  turns out not to exist and the collection is unchanged.
    //  */
    // async without(key: K, returnThisIfUnchanged?: boolean): Promise<BTree<K, V>> {
    //     return await this.withoutRange(key, key, true, returnThisIfUnchanged)
    // }

    // /** Returns a copy of the tree with the specified keys removed.
    //  * @param returnThisIfUnchanged if true, returns this if none of the keys
    //  *  existed. Performance note: due to the architecture of this class,
    //  *  node(s) leading to where the key would have been stored are cloned
    //  *  even when the key turns out not to exist.
    //  */
    // async withoutKeys(keys: K[], returnThisIfUnchanged?: boolean): Promise<BTree<K, V>> {
    //     let nu = await this.clone()
    //     return await nu.deleteKeys(keys) || !returnThisIfUnchanged ? nu : this
    // }

    // /** Returns a copy of the tree with the specified range of keys removed. */
    // async withoutRange(low: K, high: K, includeHigh: boolean, returnThisIfUnchanged?: boolean): Promise<BTree<K, V>> {
    //     let nu = await this.clone()
    //     if (await nu.deleteRange(low, high, includeHigh) === 0 && returnThisIfUnchanged)
    //         return this
    //     return nu
    // }

    // /** Returns a copy of the tree with pairs removed whenever the callback
    //  *  function returns false. `where()` is a synonym for this method. */
    // async filter(callback: (k: K, v: V, counter: number) => boolean, returnThisIfUnchanged?: boolean): Promise<BTree<K, V>> {
    //     let nu = this.greedyClone()
    //     let del: any
    //     nu.editAll((k, v, i) => {
    //         if (!callback(k, v, i)) return del = Delete
    //     })
    //     if (!del && returnThisIfUnchanged)
    //         return this
    //     return nu
    // }

    // /** Returns a copy of the tree with all values altered by a callback function. */
    // mapValues<R>(callback: (v: V, k: K, counter: number) => R): BTree<K, R> {
    //     let tmp = {} as { value: R }
    //     let nu = this.greedyClone()
    //     nu.editAll((k, v, i) => {
    //         return tmp.value = callback(v, k, i), tmp as any
    //     })
    //     return nu as any as BTree<K, R>
    // }

    /** Performs a reduce operation like the `reduce` method of `Array`.
     *  It is used to combine all pairs into a single value, or perform
     *  conversions. `reduce` is best understood by example. For example,
     *  `tree.reduce((P, pair) => P * pair[0], 1)` multiplies all keys
     *  together. It means "start with P=1, and for each pair multiply
     *  it by the key in pair[0]". Another example would be converting
     *  the tree to a Map (in this example, note that M.set returns M):
     *
     *  let M = tree.reduce((M, pair) => M.set(pair[0],pair[1]), new Map())
     *
     *  **Note**: the same array is sent to the callback on every iteration.
     */
    async reduce<R>(callback: (previous: R, currentPair: [K, V], counter: number, tree: BTree<K, V>) => R, initialValue: R): Promise<R>
    async reduce<R>(callback: (previous: R | undefined, currentPair: [K, V], counter: number, tree: BTree<K, V>) => R): Promise<R | undefined>
    async reduce<R>(callback: (previous: R | undefined, currentPair: [K, V], counter: number, tree: BTree<K, V>) => R, initialValue?: R): Promise<R | undefined> {
        let i = 0
        let p = initialValue
        let it = await this.entries(await this.minKey(), ReusedArray)
        let next
        while (!(next = it.next()).done)
            p = callback(p, next.value, i++, this)
        return p
    }

    /////////////////////////////////////////////////////////////////////////////
    // Iterator methods /////////////////////////////////////////////////////////

    /** Returns an iterator that provides items in order (ascending order if
     *  the collection's comparator uses ascending order, as is the default.)
     *  @param lowestKey First key to be iterated, or undefined to start at
     *         minKey(). If the specified key doesn't exist then iteration
     *         starts at the next higher key (according to the comparator).
     *  @param reusedArray Optional array used repeatedly to store key-value
     *         pairs, to avoid creating a new array on every iteration.
     */
    async entries(lowestKey?: K, reusedArray?: (K | V)[]): Promise<IterableIterator<[K, V]>> {
        let info = await this.findPath(lowestKey)
        if (info === undefined) return iterator<[K, V]>()
        let { nodequeue, nodeindex, leaf } = info
        let state = reusedArray !== undefined ? 1 : 0
        let i = (lowestKey === undefined ? -1 : leaf.indexOf(lowestKey, 0, this.compare) - 1)

        return iterator<[K, V]>(async () => {
            jump: for (; ;) {
                switch (state) {
                    case 0:
                        if (++i < leaf.keys.length)
                            return { done: false, value: [leaf.keys[i], leaf.values[i]] }
                        state = 2
                        continue
                    case 1:
                        if (++i < leaf.keys.length) {
                            reusedArray![0] = leaf.keys[i], reusedArray![1] = leaf.values[i]
                            return { done: false, value: reusedArray as [K, V] }
                        }
                        state = 2
                    case 2:
                        // Advance to the next leaf node
                        for (var level = -1; ;) {
                            if (++level >= nodequeue.length) {
                                state = 3; continue jump
                            }
                            if (++nodeindex[level] < nodequeue[level].length)
                                break
                        }
                        for (; level > 0; level--) {
                            nodequeue[level - 1] = await (nodequeue[level][nodeindex[level]] as BNodeInternal<K, V>).getAllChildren()
                            nodeindex[level - 1] = 0
                        }
                        leaf = nodequeue[0][nodeindex[0]]
                        i = -1
                        state = reusedArray !== undefined ? 1 : 0
                        continue
                    case 3:
                        return { done: true, value: undefined }
                }
            }
        })
    }

    /** Returns an iterator that provides items in reversed order.
     *  @param highestKey Key at which to start iterating, or undefined to
     *         start at maxKey(). If the specified key doesn't exist then iteration
     *         starts at the next lower key (according to the comparator).
     *  @param reusedArray Optional array used repeatedly to store key-value
     *         pairs, to avoid creating a new array on every iteration.
     *  @param skipHighest Iff this flag is true and the highestKey exists in the
     *         collection, the pair matching highestKey is skipped, not iterated.
     */
    async entriesReversed(highestKey?: K, reusedArray?: (K | V)[], skipHighest?: boolean): Promise<IterableIterator<[K, V]>> {
        if (highestKey === undefined) {
            highestKey = await this.maxKey()
            skipHighest = undefined
            if (highestKey === undefined)
                return iterator<[K, V]>() // collection is empty
        }
        let { nodequeue, nodeindex, leaf } = await this.findPath(highestKey) || (await this.findPath(await this.maxKey()))!
        if(!(!nodequeue[0] || leaf === nodequeue[0][nodeindex[0]])) {
            throw new Error("wat?")
        }
        let i = leaf.indexOf(highestKey, 0, this.compare)
        if (!(skipHighest || this.compare(leaf.keys[i], highestKey) > 0))
            i++
        let state = reusedArray !== undefined ? 1 : 0

        return iterator<[K, V]>(async () => {
            jump: for (; ;) {
                switch (state) {
                    case 0:
                        if (--i >= 0)
                            return { done: false, value: [leaf.keys[i], leaf.values[i]] }
                        state = 2
                        continue
                    case 1:
                        if (--i >= 0) {
                            reusedArray![0] = leaf.keys[i], reusedArray![1] = leaf.values[i]
                            return { done: false, value: reusedArray as [K, V] }
                        }
                        state = 2
                    case 2:
                        // Advance to the next leaf node
                        for (var level = -1; ;) {
                            if (++level >= nodequeue.length) {
                                state = 3; continue jump
                            }
                            if (--nodeindex[level] >= 0)
                                break
                        }
                        for (; level > 0; level--) {
                            nodequeue[level - 1] = await (nodequeue[level][nodeindex[level]] as BNodeInternal<K, V>).getAllChildren()
                            nodeindex[level - 1] = nodequeue[level - 1].length - 1
                        }
                        leaf = nodequeue[0][nodeindex[0]]
                        i = leaf.keys.length
                        state = reusedArray !== undefined ? 1 : 0
                        continue
                    case 3:
                        return { done: true, value: undefined }
                }
            }
        })
    }

    /* Used by entries() and entriesReversed() to prepare to start iterating.
     * It develops a "node queue" for each non-leaf level of the tree.
     * Levels are numbered "bottom-up" so that level 0 is a list of leaf
     * nodes from a low-level non-leaf node. The queue at a given level L
     * consists of nodequeue[L] which is the children of a BNodeInternal,
     * and nodeindex[L], the current index within that child list, such
     * such that nodequeue[L-1] === nodequeue[L][nodeindex[L]].children.
     * (However inside this function the order is reversed.)
     */
    private async findPath(key?: K): Promise<{ nodequeue: BNode<K, V>[][]; nodeindex: number[]; leaf: BNode<K, V> } | undefined> {
        let nextnode = await this.getRoot()
        let nodequeue: BNode<K, V>[][], nodeindex: number[]

        if (nextnode.isLeaf) {
            nodequeue = EmptyArray, nodeindex = EmptyArray // avoid allocations
        } else {
            nodequeue = [], nodeindex = []
            for (let d = 0; !nextnode.isLeaf; d++) {
                nodequeue[d] = await (nextnode as BNodeInternal<K, V>).getAllChildren()
                nodeindex[d] = key === undefined ? 0 : nextnode.indexOf(key, 0, this.compare)
                if (nodeindex[d] >= nodequeue[d].length)
                    return // first key > maxKey()
                nextnode = nodequeue[d][nodeindex[d]]
            }
            nodequeue.reverse()
            nodeindex.reverse()
        }
        return { nodequeue, nodeindex, leaf: nextnode }
    }

    /**
     * Computes the differences between `this` and `other`.
     * For efficiency, the diff is returned via invocations of supplied handlers.
     * The computation is optimized for the case in which the two trees have large amounts
     * of shared data (obtained by calling the `clone` or `with` APIs) and will avoid
     * any iteration of shared state.
     * The handlers can cause computation to early exit by returning {break: R}.
     * Neither of the collections should be changed during the comparison process (in your callbacks), as this method assumes they will not be mutated.
     * @param other The tree to compute a diff against.
     * @param onlyThis Callback invoked for all keys only present in `this`.
     * @param onlyOther Callback invoked for all keys only present in `other`.
     * @param different Callback invoked for all keys with differing values.
     */
    async diffAgainst<R>(
        other: BTree<K, V>,
        onlyThis?: (k: K, v: V) => { break?: R } | void,
        onlyOther?: (k: K, v: V) => { break?: R } | void,
        different?: (k: K, vThis: V, vOther: V) => { break?: R } | void
    ): Promise<R | undefined> {
        if (other.compare !== this.compare) {
            throw new Error("Tree comparators are not the same.")
        }

        if (this.isEmpty || other.isEmpty) {
            if (this.isEmpty && other.isEmpty)
                return undefined
            // If one tree is empty, everything will be an onlyThis/onlyOther.
            if (this.isEmpty)
                return onlyOther === undefined ? undefined : BTree.stepToEnd(await BTree.makeDiffCursor(other), onlyOther)
            return onlyThis === undefined ? undefined : BTree.stepToEnd(await BTree.makeDiffCursor(this), onlyThis)
        }

        // Cursor-based diff algorithm is as follows:
        // - Until neither cursor has navigated to the end of the tree, do the following:
        //  - If the `this` cursor is "behind" the `other` cursor (strictly <, via compare), advance it.
        //  - Otherwise, advance the `other` cursor.
        //  - Any time a cursor is stepped, perform the following:
        //    - If either cursor points to a key/value pair:
        //      - If thisCursor === otherCursor and the values differ, it is a Different.
        //      - If thisCursor > otherCursor and otherCursor is at a key/value pair, it is an OnlyOther.
        //      - If thisCursor < otherCursor and thisCursor is at a key/value pair, it is an OnlyThis as long as the most recent
        //        cursor step was *not* otherCursor advancing from a tie. The extra condition avoids erroneous OnlyOther calls
        //        that would occur due to otherCursor being the "leader".
        //    - Otherwise, if both cursors point to nodes, compare them. If they are equal by reference (shared), skip
        //      both cursors to the next node in the walk.
        // - Once one cursor has finished stepping, any remaining steps (if any) are taken and key/value pairs are logged
        //   as OnlyOther (if otherCursor is stepping) or OnlyThis (if thisCursor is stepping).
        // This algorithm gives the critical guarantee that all locations (both nodes and key/value pairs) in both trees that
        // are identical by value (and possibly by reference) will be visited *at the same time* by the cursors.
        // This removes the possibility of emitting incorrect diffs, as well as allowing for skipping shared nodes.
        const { compare } = this
        const thisCursor = await BTree.makeDiffCursor(this)
        const otherCursor = await BTree.makeDiffCursor(other)
        // It doesn't matter how thisSteppedLast is initialized.
        // Step order is only used when either cursor is at a leaf, and cursors always start at a node.
        let thisSuccess = true, otherSuccess = true, prevCursorOrder = BTree.compare(thisCursor, otherCursor, compare)
        while (thisSuccess && otherSuccess) {
            const cursorOrder = BTree.compare(thisCursor, otherCursor, compare)
            const { leaf: thisLeaf, internalSpine: thisInternalSpine, levelIndices: thisLevelIndices } = thisCursor
            const { leaf: otherLeaf, internalSpine: otherInternalSpine, levelIndices: otherLevelIndices } = otherCursor
            if (thisLeaf || otherLeaf) {
                // If the cursors were at the same location last step, then there is no work to be done.
                if (prevCursorOrder !== 0) {
                    if (cursorOrder === 0) {
                        if (thisLeaf && otherLeaf && different) {
                            // Equal keys, check for modifications
                            const valThis = thisLeaf.values[thisLevelIndices[thisLevelIndices.length - 1]]
                            const valOther = otherLeaf.values[otherLevelIndices[otherLevelIndices.length - 1]]
                            if (!Object.is(valThis, valOther)) {
                                const result = different(thisCursor.currentKey, valThis, valOther)
                                if (result && result?.break)
                                    return result.break
                            }
                        }
                    } else if (cursorOrder > 0) {
                        // If this is the case, we know that either:
                        // 1. otherCursor stepped last from a starting position that trailed thisCursor, and is still behind, or
                        // 2. thisCursor stepped last and leapfrogged otherCursor
                        // Either of these cases is an "only other"
                        if (otherLeaf && onlyOther) {
                            const otherVal = otherLeaf.values[otherLevelIndices[otherLevelIndices.length - 1]]
                            const result = onlyOther(otherCursor.currentKey, otherVal)
                            if (result && result.break)
                                return result.break
                        }
                    } else if (onlyThis) {
                        if (thisLeaf && prevCursorOrder !== 0) {
                            const valThis = thisLeaf.values[thisLevelIndices[thisLevelIndices.length - 1]]
                            const result = onlyThis(thisCursor.currentKey, valThis)
                            if (result && result.break)
                                return result.break
                        }
                    }
                }
            } else if (!thisLeaf && !otherLeaf && cursorOrder === 0) {
                const lastThis = thisInternalSpine.length - 1
                const lastOther = otherInternalSpine.length - 1
                const nodeThis = thisInternalSpine[lastThis][thisLevelIndices[lastThis]]
                const nodeOther = otherInternalSpine[lastOther][otherLevelIndices[lastOther]]
                if (nodeOther === nodeThis) {
                    prevCursorOrder = 0
                    thisSuccess = await BTree.step(thisCursor, true)
                    otherSuccess = await BTree.step(otherCursor, true)
                    continue
                }
            }
            prevCursorOrder = cursorOrder
            if (cursorOrder < 0) {
                thisSuccess = await BTree.step(thisCursor)
            } else {
                otherSuccess = await BTree.step(otherCursor)
            }
        }

        if (thisSuccess && onlyThis)
            return await BTree.finishCursorWalk(thisCursor, otherCursor, compare, onlyThis)
        if (otherSuccess && onlyOther)
            return await BTree.finishCursorWalk(otherCursor, thisCursor, compare, onlyOther)
    }

    ///////////////////////////////////////////////////////////////////////////
    // Helper methods for diffAgainst /////////////////////////////////////////

    private static async finishCursorWalk<K, V, R>(
        cursor: DiffCursor<K, V>,
        cursorFinished: DiffCursor<K, V>,
        compareKeys: (a: K, b: K) => number,
        callback: (k: K, v: V) => { break?: R } | void
    ): Promise<R | undefined> {
        const compared = BTree.compare(cursor, cursorFinished, compareKeys)
        if (compared === 0) {
            if (!BTree.step(cursor))
                return undefined
        } else if (compared < 0) {
            throw new Error("Cursor walk terminated early")
        }
        return await BTree.stepToEnd(cursor, callback)
    }

    private static async stepToEnd<K, V, R>(
        cursor: DiffCursor<K, V>,
        callback: (k: K, v: V) => { break?: R } | void
    ): Promise<R | undefined> {
        let canStep: boolean = true
        while (canStep) {
            const { leaf, levelIndices, currentKey } = cursor
            if (leaf) {
                const value = leaf.values[levelIndices[levelIndices.length - 1]]
                const result = callback(currentKey, value)
                if (result && result.break)
                    return result.break
            }
            canStep = await BTree.step(cursor)
        }
        return undefined
    }

    private static async makeDiffCursor<K, V>(tree: BTree<K, V>): Promise<DiffCursor<K, V>> {
        const root = await tree.getRoot()
        let height = await tree.getHeight()
        return { height: height, internalSpine: [[root]], levelIndices: [0], leaf: undefined, currentKey: await root.maxKey() }
    }

    /**
     * Advances the cursor to the next step in the walk of its tree.
     * Cursors are walked backwards in sort order, as this allows them to leverage maxKey() in order to be compared in O(1).
     * @param cursor The cursor to step
     * @param stepToNode If true, the cursor will be advanced to the next node (skipping values)
     * @returns true if the step was completed and false if the step would have caused the cursor to move beyond the end of the tree.
     */
    private static async step<K, V>(cursor: DiffCursor<K, V>, stepToNode: boolean = false): Promise<boolean> {
        const { internalSpine, levelIndices, leaf } = cursor
        if (stepToNode || leaf) {
            const levelsLength = levelIndices.length
            // Step to the next node only if:
            // - We are explicitly directed to via stepToNode, or
            // - There are no key/value pairs left to step to in this leaf
            if (stepToNode || levelIndices[levelsLength - 1] === 0) {
                const spineLength = internalSpine.length
                // Root is leaf
                if (spineLength === 0)
                    return false
                // Walk back up the tree until we find a new subtree to descend into
                const nodeLevelIndex = spineLength - 1
                let levelIndexWalkBack = nodeLevelIndex
                while (levelIndexWalkBack >= 0) {
                    const childIndex = levelIndices[levelIndexWalkBack]
                    if (childIndex > 0) {
                        if (levelIndexWalkBack < levelsLength - 1) {
                            // Remove leaf state from cursor
                            cursor.leaf = undefined
                            levelIndices.splice(levelIndexWalkBack + 1, levelsLength - levelIndexWalkBack)
                        }
                        // If we walked upwards past any internal node, splice them out
                        if (levelIndexWalkBack < nodeLevelIndex)
                            internalSpine.splice(levelIndexWalkBack + 1, spineLength - levelIndexWalkBack)
                        // Move to new internal node
                        const nodeIndex = --levelIndices[levelIndexWalkBack]
                        cursor.currentKey = await internalSpine[levelIndexWalkBack][nodeIndex].maxKey()
                        return true
                    }
                    levelIndexWalkBack--
                }
                // Cursor is in the far left leaf of the tree, no more nodes to enumerate
                return false
            } else {
                // Move to new leaf value
                const valueIndex = --levelIndices[levelsLength - 1]
                cursor.currentKey = (leaf as unknown as BNode<K, V>).keys[valueIndex]
                return true
            }
        } else { // Cursor does not point to a value in a leaf, so move downwards
            const nextLevel = internalSpine.length
            const currentLevel = nextLevel - 1
            const node = internalSpine[currentLevel][levelIndices[currentLevel]]
            if (node.isLeaf) {
                // Entering into a leaf. Set the cursor to point at the last key/value pair.
                cursor.leaf = node
                const valueIndex = levelIndices[nextLevel] = node.values.length - 1
                cursor.currentKey = node.keys[valueIndex]
            } else {
                const children = await (node as BNodeInternal<K, V>).getAllChildren()
                internalSpine[nextLevel] = children
                const childIndex = children.length - 1
                levelIndices[nextLevel] = childIndex
                cursor.currentKey = await children[childIndex].maxKey()
            }
            return true
        }
    }

    /**
     * Compares the two cursors. Returns a value indicating which cursor is ahead in a walk.
     * Note that cursors are advanced in reverse sorting order.
     */
    private static compare<K, V>(cursorA: DiffCursor<K, V>, cursorB: DiffCursor<K, V>, compareKeys: (a: K, b: K) => number): number {
        const { height: heightA, currentKey: currentKeyA, levelIndices: levelIndicesA } = cursorA
        const { height: heightB, currentKey: currentKeyB, levelIndices: levelIndicesB } = cursorB
        // Reverse the comparison order, as cursors are advanced in reverse sorting order
        const keyComparison = compareKeys(currentKeyB, currentKeyA)
        if (keyComparison !== 0) {
            return keyComparison
        }

        // Normalize depth values relative to the shortest tree.
        // This ensures that concurrent cursor walks of trees of differing heights can reliably land on shared nodes at the same time.
        // To accomplish this, a cursor that is on an internal node at depth D1 with maxKey X is considered "behind" a cursor on an
        // internal node at depth D2 with maxKey Y, when D1 < D2. Thus, always walking the cursor that is "behind" will allow the cursor
        // at shallower depth (but equal maxKey) to "catch up" and land on shared nodes.
        const heightMin = heightA < heightB ? heightA : heightB
        const depthANormalized = levelIndicesA.length - (heightA - heightMin)
        const depthBNormalized = levelIndicesB.length - (heightB - heightMin)
        return depthANormalized - depthBNormalized
    }

    // End of helper methods for diffAgainst //////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    /** Returns a new iterator for iterating the keys of each pair in ascending order.
     *  @param firstKey: Minimum key to include in the output. */
    async keys(firstKey?: K): Promise<IterableIterator<K>> {
        let it = await this.entries(firstKey, ReusedArray)
        return iterator<K>(async () => {
            let n: IteratorResult<any> = it.next()
            if (n.value) n.value = n.value[0]
            return n
        })
    }

    /** Returns a new iterator for iterating the values of each pair in order by key.
     *  @param firstKey: Minimum key whose associated value is included in the output. */
    async values(firstKey?: K): Promise<IterableIterator<V>> {
        let it = await this.entries(firstKey, ReusedArray)
        return iterator<V>(async () => {
            let n: IteratorResult<any> = it.next()
            if (n.value) n.value = n.value[1]
            return n
        })
    }

    /** Gets the lowest key in the tree. Complexity: O(log size) */
    async minKey(): Promise<K | undefined> { return await (await this.getRoot()).minKey() }

    /** Gets the highest key in the tree. Complexity: O(1) */
    async maxKey(): Promise<K | undefined> { return await (await this.getRoot()).maxKey() }

    /** Gets an array filled with the contents of the tree, sorted by key */
    async toArray(maxLength: number = 0x7FFFFFFF): Promise<[K, V][]> {
        let min = await this.minKey()
        let max = await this.maxKey()
        if (min !== undefined)
            return await this.getRange(min, max!, true, maxLength)
        return []
    }

    /** Gets an array of all keys, sorted */
    async keysArray(): Promise<K[]> {
        let root = await this.getRoot()
        let results: K[] = []
        await root.forRange((await this.minKey())!, (await this.maxKey())!, true, false, this, 0,
            (k, v) => { results.push(k) })
        return results
    }

    /** Gets an array of all values, sorted by key */
    async valuesArray(): Promise<V[]> {
        let root = await this.getRoot()
        let results: V[] = []
        await root.forRange((await this.minKey())!, (await this.maxKey())!, true, false, this, 0,
            (k, v) => { results.push(v) })
        return results
    }

    /** Stores a key-value pair only if the key doesn't already exist in the tree.
     * @returns true if a new key was added
    */
    async setIfNotPresent(key: K, value: V): Promise<boolean> {
        return await this.set(key, value, false)
    }

    /** Returns the next pair whose key is larger than the specified key (or undefined if there is none).
     *  If key === undefined, this function returns the lowest pair.
     */
    async nextHigherPair(key: K | undefined): Promise<[K, V] | undefined> {
        let it = await this.entries(key, ReusedArray)
        let r = it.next()
        if (!r.done && key !== undefined && this.compare(r.value[0], key) <= 0)
            r = it.next()
        return r.value
    }

    /** Returns the next key larger than the specified key (or undefined if there is none) */
    async nextHigherKey(key: K | undefined): Promise<K | undefined> {
        let p = await this.nextHigherPair(key)
        return p ? p[0] : p
    }

    /** Returns the next pair whose key is smaller than the specified key (or undefined if there is none).
     *  If key === undefined, this function returns the highest pair.
     */
    async nextLowerPair(key: K | undefined): Promise<[K, V] | undefined> {
        let it = await this.entriesReversed(key, ReusedArray, true)
        return it.next().value
    }

    /** Returns the next key smaller than the specified key (or undefined if there is none) */
    async nextLowerKey(key: K | undefined): Promise<K | undefined> {
        let p = await this.nextLowerPair(key)
        return p ? p[0] : p
    }

    /** Edits the value associated with a key in the tree, if it already exists.
     * @returns true if the key existed, false if not.
    */
    async changeIfPresent(key: K, value: V): Promise<boolean> {
        return await this.editRange(key, key, true, (k, v) => ({ value })) !== 0
    }

    /**
     * Builds an array of pairs from the specified range of keys, sorted by key.
     * Each returned pair is also an array: pair[0] is the key, pair[1] is the value.
     * @param low The first key in the array will be greater than or equal to `low`.
     * @param high This method returns when a key larger than this is reached.
     * @param includeHigh If the `high` key is present, its pair will be included
     *        in the output if and only if this parameter is true. Note: if the
     *        `low` key is present, it is always included in the output.
     * @param maxLength Length limit. getRange will stop scanning the tree when
     *                  the array reaches this size.
     * @description Computational complexity: O(result.length + log size)
     */
    async getRange(low: K, high: K, includeHigh?: boolean, maxLength: number = 0x3FFFFFF): Promise<[K, V][]> {
        let results: [K, V][] = []
        let root = await this.getRoot()
        await root.forRange(low, high, includeHigh, false, this, 0, (k, v) => {
            results.push([k, v])
            return results.length > maxLength ? Break : undefined
        })
        return results
    }

    /** Adds all pairs from a list of key-value pairs.
     * @param pairs Pairs to add to this tree. If there are duplicate keys,
     *        later pairs currently overwrite earlier ones (e.g. [[0,1],[0,7]]
     *        associates 0 with 7.)
     * @param overwrite Whether to overwrite pairs that already exist (if false,
     *        pairs[i] is ignored when the key pairs[i][0] already exists.)
     * @returns The number of pairs added to the collection.
     * @description Computational complexity: O(pairs.length * log(size + pairs.length))
     */
    async setPairs(pairs: [K, V][], overwrite?: boolean): Promise<number> {
        let added = 0
        for (let i = 0; i < pairs.length; i++)
            if (await this.set(pairs[i][0], pairs[i][1], overwrite))
                added++
        return added
    }

    /**
     * Scans the specified range of keys, in ascending order by key.
     * Note: the callback `onFound` must not insert or remove items in the
     * collection. Doing so may cause incorrect data to be sent to the
     * callback afterward.
     * @param low The first key scanned will be greater than or equal to `low`.
     * @param high Scanning stops when a key larger than this is reached.
     * @param includeHigh If the `high` key is present, `onFound` is called for
     *        that final pair if and only if this parameter is true.
     * @param onFound A function that is called for each key-value pair. This
     *        function can return {break:R} to stop early with result R.
     * @param initialCounter Initial third argument of onFound. This value
     *        increases by one each time `onFound` is called. Default: 0
     * @returns The number of values found, or R if the callback returned
     *        `{break:R}` to stop early.
     * @description Computational complexity: O(number of items scanned + log size)
     */
    async forRange(low: K, high: K, includeHigh: boolean, onFound?: (k: K, v: V, counter: number) => void, initialCounter?: number): Promise<number>
    async forRange<R = number>(low: K, high: K, includeHigh: boolean, onFound?: (k: K, v: V, counter: number) => { break?: R } | void, initialCounter?: number): Promise<number | R> {
        let root = await this.getRoot()
        let r = await root.forRange(low, high, includeHigh, false, this, initialCounter || 0, onFound)
        return typeof r === "number" ? r : r.break!
    }

    /**
     * Scans and potentially modifies values for a subsequence of keys.
     * Note: the callback `onFound` should ideally be a pure function.
     *   Specfically, it must not insert items, call clone(), or change
     *   the collection except via return value; out-of-band editing may
     *   cause an exception or may cause incorrect data to be sent to
     *   the callback (duplicate or missed items). It must not cause a
     *   clone() of the collection, otherwise the clone could be modified
     *   by changes requested by the callback.
     * @param low The first key scanned will be greater than or equal to `low`.
     * @param high Scanning stops when a key larger than this is reached.
     * @param includeHigh If the `high` key is present, `onFound` is called for
     *        that final pair if and only if this parameter is true.
     * @param onFound A function that is called for each key-value pair. This
     *        function can return `{value:v}` to change the value associated
     *        with the current key, `{delete:true}` to delete the current pair,
     *        `{break:R}` to stop early with result R, or it can return nothing
     *        (undefined or {}) to cause no effect and continue iterating.
     *        `{break:R}` can be combined with one of the other two commands.
     *        The third argument `counter` is the number of items iterated
     *        previously; it equals 0 when `onFound` is called the first time.
     * @returns The number of values scanned, or R if the callback returned
     *        `{break:R}` to stop early.
     * @description
     *   Computational complexity: O(number of items scanned + log size)
     *   Note: if the tree has been cloned with clone(), any shared
     *   nodes are copied before `onFound` is called. This takes O(n) time
     *   where n is proportional to the amount of shared data scanned.
     */
    async editRange<R = V>(low: K, high: K, includeHigh: boolean, onFound: (k: K, v: V, counter: number) => EditRangeResult<V, R> | void, initialCounter?: number): Promise<number | R> {
        let root = await this.getRoot()
        try {
            let r = await root.forRange(low, high, includeHigh, true, this, initialCounter || 0, onFound)
            return typeof r === "number" ? r : r.break!
        } finally {
            while (root.keys.length <= 1 && !root.isLeaf) {
                let newRoot = root.keys.length === 0 ?
                    await EmptyLeaf(this.txState) :
                    await (root as any as BNodeInternal<K, V>).getChild(0)
                this.root = newRoot.id
                this.txState.index.setAsModified(this.id)
            }
        }
    }

    /** Same as `editRange` except that the callback is called for all pairs. */
    async editAll<R = V>(onFound: (k: K, v: V, counter: number) => EditRangeResult<V, R> | void, initialCounter?: number): Promise<number | R> {
        return await this.editRange((await this.minKey())!, (await this.maxKey())!, true, onFound, initialCounter)
    }

    /**
     * Removes a range of key-value pairs from the B+ tree.
     * @param low The first key scanned will be greater than or equal to `low`.
     * @param high Scanning stops when a key larger than this is reached.
     * @param includeHigh Specifies whether the `high` key, if present, is deleted.
     * @returns The number of key-value pairs that were deleted.
     * @description Computational complexity: O(log size + number of items deleted)
     */
    async deleteRange(low: K, high: K, includeHigh: boolean): Promise<number> {
        return await this.editRange(low, high, includeHigh, DeleteRange)
    }

    /** Deletes a series of keys from the collection. */
    async deleteKeys(keys: K[]): Promise<number> {
        let i = 0
        let r = 0
        while (i < keys.length) {
            if (await this.delete(keys[i]))
                r++
            i++
        }
        return r
    }

    /** Gets the height of the tree: the number of internal nodes between the
     *  BTree object and its leaf nodes (zero if there are no internal nodes). */
    async getHeight(): Promise<number> {
        let node: BNode<K, V> | undefined = await this.getRoot()
        let height = -1
        while (node) {
            height++
            node = node.isLeaf ? undefined : await (node as unknown as BNodeInternal<K, V>).getChild(0)
        }
        return height
    }

    /** Scans the tree for signs of serious bugs (e.g. this.size doesn't match
     *  number of elements, internal nodes not caching max element properly...)
     *  Computational complexity: O(number of nodes), i.e. O(size). This method
     *  skips the most expensive test - whether all keys are sorted - but it
     *  does check that maxKey() of the children of internal nodes are sorted. */
    async checkValid() {
        let root = await this.getRoot()
        let size = await root.checkValid(0, this, 0)
        if(!(size === this.size)) {
            throw new Error(`BTree size (${size}) does not match number of elements (${this.size})`)
        }
    }
}

export type Comparator<K> = (a: K, b: K) => -1 | 0 | 1



/**
 * Compares items using the < and > operators. This function is probably slightly
 * faster than the defaultComparator for Dates and strings, but has not been benchmarked.
 * Unlike defaultComparator, this comparator doesn't support mixed types correctly,
 * i.e. use it with `BTree<string>` or `BTree<number>` but not `BTree<string|number>`.
 *
 * NaN is not supported.
 *
 * Note: null is treated like 0 when compared with numbers or Date, but in general
 *   null is not ordered with respect to strings (neither greater nor less), and
 *   undefined is not ordered with other types.
 */
export function simpleComparator(a: string, b: string): number
export function simpleComparator(a: number | null, b: number | null): number
export function simpleComparator(a: Date | null, b: Date | null): number
export function simpleComparator(a: (number | string)[], b: (number | string)[]): number
export function simpleComparator(a: any, b: any): number {
    return a > b ? 1 : a < b ? -1 : 0
}

/**
 * A walkable pointer into a BTree for computing efficient diffs between trees with shared data.
 * - A cursor points to either a key/value pair (KVP) or a node (which can be either a leaf or an internal node).
 *    As a consequence, a cursor cannot be created for an empty tree.
 * - A cursor can be walked forwards using `step`. A cursor can be compared to another cursor to
 *    determine which is ahead in advancement.
 * - A cursor is valid only for the tree it was created from, and only until the first edit made to
 *    that tree since the cursor's creation.
 * - A cursor contains a key for the current location, which is the maxKey when the cursor points to a node
 *    and a key corresponding to a value when pointing to a leaf.
 * - Leaf is only populated if the cursor points to a KVP. If this is the case, levelIndices.length === internalSpine.length + 1
 *    and levelIndices[levelIndices.length - 1] is the index of the value.
 */
type DiffCursor<K, V> = { height: number, internalSpine: BNode<K, V>[][], levelIndices: number[], leaf: BNode<K, V> | undefined, currentKey: K }

const Break = { break: true }
export const EmptyLeaf = async function (txState: TransactionCollection) {
    let id = await txState.bnode.allocateID()
    let n = new BNode<any, any>(txState, id, [],[])
    txState.bnode.setInstance(id, n)
    return n
}
const EmptyArray: any[] = []
const ReusedArray: any[] = [] // assumed thread-local

const Delete = {delete: true}
const DeleteRange = () => Delete;
