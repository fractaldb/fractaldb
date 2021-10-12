
import TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import { BNodeUnionData } from '@fractaldb/fractal-server/structures/Subcollection.js'
import { BNodeTypes } from '@fractaldb/shared/structs/DataTypes.js'
import BTree from './BTree.js'
// BTree Node

export type index = number

export type EditRangeResult<V, R = number> = { value?: V, break?: R, delete?: boolean }

export class BNode<K, V> {
    keys: K[]
    values: V[]
    txState: TransactionCollection
    id: number

    get isLeaf() { return (this as any).children === undefined }

    constructor(txState: TransactionCollection, id: number, keys: K[], values?: V[]) {
        this.id = id
        this.txState = txState
        this.keys = keys
        this.values = values || undefVals as any[]
    }

    deinstantiate(): BNodeUnionData<V> {
        return [BNodeTypes.Leaf, [...this.keys], [...this.values]]
    }

    async maxKey() {
        return this.keys[this.keys.length - 1]
    }

    // if key not found, returns i^failXor where i is the insertion index
    // Callers that don't care whethere there was a match will set failXor to 0
    indexOf(key: K, failXor: number, cmp: (a: K, b: K) => number): index {
        const keys = this.keys
        let lo = 0, hi = keys.length, mid = hi >> 1
        while (lo < hi) {
            var c = cmp(keys[mid], key)
            if (c < 0)
                lo = mid + 1
            else if (c > 0) // key < keys[mid]
                hi = mid
            else if (c === 0)
                return mid
            else {
                // c is NaN or otherwise invalid
                if (key === key) // at least the search key is not NaN
                    return keys.length
                else
                    throw new Error("BTree: NaN was used as a key")
            }
            mid = (lo + hi) >> 1
        }
        return mid ^ failXor
    }

    async minKey() {
        return this.keys[0]
    }

    async clone(): Promise<BNode<K, V>> {
        var v = this.values
        return new BNode<K, V>(this.txState, this.id, this.keys.slice(0), v === undefVals ? v : v.slice(0))
    }

    async get(key: K, tree: BTree<K, V>): Promise<V | undefined> {
        let i = this.indexOf(key, -1, tree.compare)
        return i < 0 ? undefined : this.values[i]
    }

    async checkValid(depth: number, tree: BTree<K, V>, baseIndex: number): Promise<number> {
        let kL = this.keys.length
        let vL = this.values.length

        if (!(this.values === undefVals ? kL <= vL : kL === vL)) {
            throw new Error(`BTree: keys/values length mismatch: depth ${depth} with lengths ${kL}:${vL} and baseIndex: ${baseIndex}`)
        }
        if (!(depth === 0 || kL > 0)) {
            throw new Error(`BTree: empty leaf at depth ${depth} and baseIndex ${baseIndex}`)
        }

        return kL
    }

    /**
     * Leaf node: set & node splitting
     */
    async set(key: K, value: V, overwrite: boolean | undefined, tree: BTree<K, V>): Promise<boolean | BNode<K, V>> {
        let i = this.indexOf(key, -1, tree.compare)

        if (i < 0) {
            // key does not exist yet
            i = ~i
            tree.size++
            if (this.keys.length < tree.maxNodeSize) {
                return await this.insertInLeaf(i, key, value, tree)
            } else {
                let newRightSibling = await this.splitOffRightSide()
                let target: BNode<K, V> = this
                if (i > this.keys.length) {
                    i -= this.keys.length
                    target = newRightSibling
                }
                await target.insertInLeaf(i, key, value, tree)
                return newRightSibling // TODO: check parent calls to see if this is saved
            }
        } else {
            // key exists
            if (overwrite !== false) {
                await this.txState.bnode.setAsModified(this.id)
                if (value !== undefined)
                    await this.reifyValues()
                this.values[i] = value
            }
            return false
        }
    }

    reifyValues() {
        if (this.values === undefVals)
            return this.values = this.values.slice(0, this.keys.length)
        return this.values
    }

    async insertInLeaf(i: index, key: K, value: V, tree: BTree<K, V>): Promise<boolean> {
        await this.txState.bnode.setAsModified(this.id)
        this.keys.splice(i, 0, key)
        if (this.values === undefVals) {
            while (undefVals.length < tree.maxNodeSize)
                undefVals.push(undefined)
            if (value === undefined) {
                return true
            } else {
                this.values = undefVals.slice(0, this.keys.length - 1)
            }
        }
        this.values.splice(i, 0, value)
        return true
    }

    async takeFromRight(rhs: BNode<K, V>) {
        await this.txState.bnode.setAsModified(this.id)
        // parent node must update its copy of key for this node
        // assert: neither node is shared
        // assert: rhs.keys.length > (maxNodeSize/2 && this.keys.length < maxNodeSize)
        let v = this.values
        if (rhs.values === undefVals) {
            if (v !== undefVals)
                v.push(undefined as any)
        } else {
            v = this.reifyValues()
            v.push(rhs.values.shift()!)
        }
        this.keys.push(rhs.keys.shift()!)
    }

    async takeFromLeft(lhs: BNode<K, V>) {
        await this.txState.bnode.setAsModified(this.id)
        // Reminder: parent node must update its copy of key for this node
        // assert: neither node is shared
        // assert rhs.keys.length > (maxNodeSize/2 && this.keys.length<maxNodeSize)
        let v = this.values
        if (lhs.values === undefVals) {
            if (v !== undefVals)
                v.unshift(undefined as any)
        } else {
            v = this.reifyValues()
            v.unshift(lhs.values.pop()!)
        }
        this.keys.unshift(lhs.keys.pop()!)
    }

    async splitOffRightSide(): Promise<BNode<K, V>> {
        // Reminder: parent node must update its copy of key for this node
        await this.txState.bnode.setAsModified(this.id)
        let half = this.keys.length >> 1, keys = this.keys.splice(half)
        let values = this.values === undefVals ? undefVals : this.values.splice(half)

        let id = await this.txState.bnode.allocateID()
        let node = new BNode<K, V>(this.txState, id, keys, values)
        await node.txState.bnode.instances.set(id, node)

        return node
    }

    /////////////////////////////////////////////////////////////////////////////
    // Leaf Node: scanning & deletions //////////////////////////////////////////
    async forRange<R>(low: K, high: K, includeHigh: boolean | undefined, editMode: boolean, tree: BTree<K, V>, count: number,
        onFound?: (k: K, v: V, counter: number) => EditRangeResult<V, R> | void): Promise<EditRangeResult<V, R> | number> {
            let cmp = tree.compare
        let iLow, iHigh
        if (high === low) {
            if (!includeHigh)
                return count
            iHigh = (iLow = this.indexOf(low, -1, cmp)) + 1
            if (iLow < 0)
                return count
        } else {
            iLow = this.indexOf(low, 0, cmp)
            iHigh = this.indexOf(high, -1, cmp)
            if (iHigh < 0)
                iHigh = ~iHigh
            else if (includeHigh === true)
                iHigh++
        }
        let keys = this.keys, values = this.values
        if (onFound !== undefined) {
            for (let i = iLow; i < iHigh; i++) {
                let key = keys[i]
                let result = await onFound(key, values[i], count++) // does this do modifications? if so, we should set as modified
                if (result !== undefined) {
                    if (editMode === true) {
                        if (key !== keys[i])
                            throw new Error("BTree illegally changed or cloned in editRange")
                        if (result.delete) {
                            await this.txState.bnode.setAsModified(this.id)
                            this.keys.splice(i, 1)
                            if (this.values !== undefVals)
                                this.values.splice(i, 1)
                            tree.size--
                            i--
                            iHigh--
                        } else if (result.hasOwnProperty('value')) {
                            await this.txState.bnode.setAsModified(this.id)
                            values![i] = result.value!
                        }
                    }
                    if (result.break !== undefined)
                        return result
                }
            }
        } else
            count += iHigh - iLow
        return count
    }

    /** Adds entire contents of right-hand sibling (rhs is left unchanged) */
    async mergeSibling(rhs: BNode<K, V>, _: number) {
        await this.txState.bnode.setAsModified(this.id)
        this.keys.push.apply(this.keys, rhs.keys)
        if (this.values === undefVals) {
            if (rhs.values === undefVals)
                return
            this.values = this.values.slice(0, this.keys.length)
        }
        this.values.push.apply(this.values, rhs.reifyValues())
    }
}

/**
 * internal node for B-Tree
 */
export class BNodeInternal<K, V> extends BNode<K, V> {
    // Note: conventionally B+ trees have one fewer key than the number of
    // children, but I find it easier to keep the array lengths equal: each
    // keys[i] caches the value of children[i].maxKey().
    children: number[]

    constructor(txState: TransactionCollection, id: number, children: number[], keys: K[]) {
        super(txState, id, keys)
        this.children = children
    }

    deinstantiate(): BNodeUnionData<V> {
        return [BNodeTypes.Internal, [...this.keys], [...this.children]]
    }

    async getChild(i: number): Promise<BNode<K, V>> {
        return (await this.txState.bnode.getOrInstantiate(this.children[i])) as BNode<K, V>
    }

    async getAllChildren() {
        return await Promise.all(this.children.map(id => this.getChild(id)))
    }

    async clone(): Promise<BNode<K, V>> {
        return new BNodeInternal<K, V>(this.txState, this.id, this.children.slice(0), this.keys.slice(0)) as any
    }

    async minKey() {
        return await (await this.getChild(0)).minKey()
    }

    async get(key: K, tree: BTree<K, V>): Promise<V | undefined>{
        let i = this.indexOf(key, 0, tree.compare)
        let children = this.children
        return i < children.length ? await (await this.getChild(i)).get(key, tree) : undefined
    }

    async checkValid(depth: number, tree: BTree<K, V>, baseIndex: number): Promise<number> {
        let kL = this.keys.length
        let cL = this.children.length

        if (!(kL === cL)) throw new Error(`B+Tree: keys/children length mismatch: depth ${depth} lengths ${kL} ${cL} baseIndex ${baseIndex}`)
        if (!(kL > 1 || depth > 0)) throw new Error(`B+Tree: internal node has length ${kL} at depth ${depth} baseIndex ${baseIndex}`)

        let size = 0
        let c = this.children
        let k = this.keys
        let childSize = 0
        for (let i = 0; i < cL; i++) {
            let child = await this.getChild(i)
            size += await child.checkValid(depth + 1, tree, baseIndex + size)
            childSize += child.keys.length
            if (!(size >= childSize)) {
                throw new Error(`B+Tree: child size ${childSize} is smaller than parent size ${size} at depth ${depth} baseIndex ${baseIndex}`)
            }
            if (!(i === 0 || c[i - 1].constructor === c[i].constructor)) {
                throw new Error(`B+Tree: child type mismatch at depth ${depth} baseIndex ${baseIndex}`)
            }
            if (await child.maxKey() != k[i]) {
                throw new Error(`B+Tree: keys[${i}] is wrong, should be ${await child.maxKey()} at depth ${depth} baseIndex ${baseIndex}`)
            }
            if (!(i === 0 || tree.compare(k[i - 1], k[i]) < 0)) {
                throw new Error(`B+Tree: keys out of order at depth ${depth} baseIndex ${baseIndex}`)
            }

        }

        let toofew = childSize === 0
        if (toofew || childSize > tree.maxNodeSize * cL) {
            throw new Error(`B+Tree: ${toofew ? 'too few' : 'too many'} children(${childSize} ${size}) at ${depth} maxNodeSize: ${tree.maxNodeSize} children.length: ${cL} baseIndex ${baseIndex}`)
        }
        return size
    }

    /**
     * Internal node: set & node splitting
     */
    async set(key: K, value: V, overwrite: boolean | undefined, tree: BTree<K, V>): Promise<boolean | BNodeInternal<K, V>> {
        let c = this.children
        let max = tree.maxNodeSize
        let cmp = tree.compare
        let i = Math.min(this.indexOf(key, 0, cmp), c.length - 1)
        let child = await this.getChild(i)

        if (child.keys.length >= max) {
            // child is full; inserting anything else will cause a split.
            // Shifting an item to the left or right sibling may avoid a split.
            // We can do a shift if the adjacent node is not full and if the
            // current key can still be placed in the same node after the shift.
            var other: BNode<K, V>
            if (i > 0 && (other = await this.getChild(i - 1)).keys.length < max && cmp(child.keys[0], key) < 0) {
                await other.takeFromRight(child)
                this.txState.bnode.setAsModified(this.id)
                this.keys[i - 1] = await other.maxKey()
            } else if ((other = await this.getChild(i + 1)) !== undefined && other.keys.length < max && cmp(await child.maxKey(), key) < 0) {
                await other.takeFromLeft(child)
                this.txState.bnode.setAsModified(this.id)
                this.keys[i] = await (await this.getChild(i)).maxKey()
            }
        }

        var result = await child.set(key, value, overwrite, tree)
        if (result === false)
            return false

        this.txState.bnode.setAsModified(this.id)
        this.keys[i] = await child.maxKey()
        if (result === true)
            return true

        // The child has split and `result` is a new right child... does it fit?
        if (this.keys.length < max) { // yes
            await this.insert(i + 1, result)
            return true
        } else { // no, we must split also
            var newRightSibling = await this.splitOffRightSide(), target: BNodeInternal<K, V> = this
            if (cmp(await result.maxKey(), await this.maxKey()) > 0) {
                target = newRightSibling
                i -= this.keys.length
            }
            await target.insert(i + 1, result)
            return newRightSibling
        }
    }

    async insert(i: index, child: BNode<K, V>) {
        await this.txState.bnode.setAsModified(this.id)
        this.children.splice(i, 0, child.id)
        this.keys.splice(i, 0, await child.maxKey())
    }

    async splitOffRightSide() {
        var half = this.children.length >> 1
        let id = await this.txState.bnode.allocateID()
        let node = new BNodeInternal<K, V>(this.txState, id, this.children.splice(half), this.keys.splice(half))
        await node.txState.bnode.instances.set(id, node)
        return node
    }

    async takeFromRight(rhs: BNode<K, V>) {
        await this.txState.bnode.setAsModified(this.id)
        // Reminder: parent node must update its copy of key for this node
        // assert: neither node is shared
        // assert rhs.keys.length > (maxNodeSize/2 && this.keys.length<maxNodeSize)
        this.keys.push(rhs.keys.shift()!)
        this.children.push((rhs as BNodeInternal<K, V>).children.shift()!)
    }

    async takeFromLeft(lhs: BNode<K, V>) {
        await this.txState.bnode.setAsModified(this.id)
        // Reminder: parent node must update its copy of key for this node
        // assert: neither node is shared
        // assert rhs.keys.length > (maxNodeSize/2 && this.keys.length<maxNodeSize)
        this.keys.unshift(lhs.keys.pop()!)
        this.children.unshift((lhs as BNodeInternal<K, V>).children.pop()!)
    }

    /////////////////////////////////////////////////////////////////////////////
    // Internal Node: scanning & deletions //////////////////////////////////////

    // Note: `count` is the next value of the third argument to `onFound`.
    //       A leaf node's `forRange` function returns a new value for this counter,
    //       unless the operation is to stop early.
    async forRange<R>(low: K, high: K, includeHigh: boolean | undefined, editMode: boolean, tree: BTree<K, V>, count: number,
        onFound?: (k: K, v: V, counter: number) => EditRangeResult<V, R> | void): Promise<EditRangeResult<V, R> | number> {
        var cmp = tree.compare
        var keys = this.keys
        let children = this.children
        var iLow = this.indexOf(low, 0, cmp), i = iLow
        var iHigh = Math.min(high === low ? iLow : this.indexOf(high, 0, cmp), keys.length - 1)
        if (!editMode) {
            // Simple case
            for (; i <= iHigh; i++) {
                var result = await (await this.getChild(i)).forRange(low, high, includeHigh, editMode, tree, count, onFound)
                if (typeof result !== 'number')
                    return result
                count = result
            }
        } else if (i <= iHigh) {
            try {
                for (; i <= iHigh; i++) {
                    var result = await (await this.getChild(i)).forRange(low, high, includeHigh, editMode, tree, count, onFound)
                    // Note: if children[i] is empty then keys[i]=undefined.
                    //       This is an invalid state, but it is fixed below.
                    await this.txState.bnode.setAsModified(this.id)
                    keys[i] = await (await this.getChild(i)).maxKey()
                    if (typeof result !== 'number')
                        return result
                    count = result
                }
            } finally {
                // Deletions may have occurred, so look for opportunities to merge nodes.
                var half = tree.maxNodeSize >> 1
                if (iLow > 0)
                    iLow--
                for (i = iHigh; i >= iLow; i--) {
                    let child = await this.getChild(i)
                    if (child.keys.length <= half) {
                        if (child.keys.length !== 0) {
                            await this.tryMerge(i, tree.maxNodeSize)
                        } else { // child is empty! delete it!
                            await this.txState.bnode.setActual(this.id, null) // I think this means deleted
                            keys.splice(i, 1)
                            children.splice(i, 1)
                        }
                    }
                }
                if (children.length !== 0 && (await this.getChild(0)).keys.length === 0)
                    throw new Error("BUG: empty root node")
            }
        }
        return count
    }

    /** Merges child i with child i+1 if their combined size is not too large */
    async tryMerge(i: index, maxSize: number): Promise<boolean> {
        var children = this.children
        if (i >= 0 && i + 1 < children.length) {
            let child1 = await this.getChild(i)
            let child2 = await this.getChild(i + 1)
            if (child1.keys.length + child2.keys.length <= maxSize) {
                await child1.mergeSibling(child2, maxSize)
                await this.txState.bnode.setAsModified(this.id)
                children.splice(i + 1, 1)
                this.keys.splice(i + 1, 1)
                this.keys[i] = await child1.maxKey()
                return true
            }
        }
        return false
    }

    async mergeSibling(rhs: BNode<K, V>, maxNodeSize: number) {
        // assert !this.isShared;
        var oldLength = this.keys.length

        await this.txState.bnode.setAsModified(this.id)

        this.keys.push.apply(this.keys, rhs.keys)
        this.children.push.apply(this.children, (rhs as any as BNodeInternal<K, V>).children)
        // If our children are themselves almost empty due to a mass-delete,
        // they may need to be merged too (but only the oldLength-1 and its
        // right sibling should need this).
        await this.tryMerge(oldLength - 1, maxNodeSize)
    }
}

let undefVals: any[] = []