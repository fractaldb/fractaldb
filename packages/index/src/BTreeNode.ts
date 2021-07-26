import { TransactionState } from '@fractaldb/fractal-server/db/TransactionState.js'
import BTree from './BTree.js'
// BTree Node

export type index = number

export type EditRangeResult<V, R = number> = { value?: V, break?: R, delete?: boolean }

export class BNode<K, V> {
    keys: K[]
    values: V[]
    isShared: true | undefined

    get isLeaf() { return (this as any).children === undefined }

    constructor(keys: K[], values?: V[]) {
        this.keys = keys
        this.values = values || undefVals as any[]
        this.isShared = undefined
    }

    maxKey() {
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

    minKey() {
        return this.keys[0]
    }

    clone(): BNode<K, V> {
        var v = this.values
        return new BNode<K, V>(this.keys.slice(0), v === undefVals ? v : v.slice(0))
    }

    greedyClone(force?: boolean): BNode<K, V> {
        return this.isShared && !force ? this : this.clone()
    }

    get(key: K, tree: BTree<K, V>): V | undefined {
        let i = this.indexOf(key, -1, tree.compare)
        return i < 0 ? undefined : this.values[i]
    }

    checkValid(depth: number, tree: BTree<K, V>, baseIndex: number): number {
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
    set(key: K, value: V, overwrite: boolean | undefined, tree: BTree<K, V>): boolean | BNode<K, V> {
        let i = this.indexOf(key, -1, tree.compare)
        if (i < 0) {
            // key does not exist yet
            i = ~i
            tree.size++
            if (this.keys.length < tree.maxNodeSize) {
                return this.insertInLeaf(i, key, value, tree)
            } else {
                let newRightSibling = this.splitOffRightSide()
                let target: BNode<K, V> = this
                if (i > this.keys.length) {
                    i -= this.keys.length
                    target = newRightSibling
                }
                target.insertInLeaf(i, key, value, tree)
                return newRightSibling
            }
        } else {
            // key exists
            if (overwrite !== false) {
                if (value !== undefined)
                    this.reifyValues()
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

    insertInLeaf(i: index, key: K, value: V, tree: BTree<K, V>): boolean {
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

    takeFromRight(rhs: BNode<K, V>) {
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

    takeFromLeft(lhs: BNode<K, V>) {
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

    splitOffRightSide(): BNode<K, V> {
        // Reminder: parent node must update its copy of key for this node
        let half = this.keys.length >> 1, keys = this.keys.splice(half)
        let values = this.values === undefVals ? undefVals : this.values.splice(half)
        return new BNode<K, V>(keys, values)
    }

    /////////////////////////////////////////////////////////////////////////////
    // Leaf Node: scanning & deletions //////////////////////////////////////////
    forRange<R>(low: K, high: K, includeHigh: boolean | undefined, editMode: boolean, tree: BTree<K, V>, count: number,
        onFound?: (k: K, v: V, counter: number) => EditRangeResult<V, R> | void): EditRangeResult<V, R> | number {
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
                let result = onFound(key, values[i], count++)
                if (result !== undefined) {
                    if (editMode === true) {
                        if (key !== keys[i] || this.isShared === true)
                            throw new Error("BTree illegally changed or cloned in editRange")
                        if (result.delete) {
                            this.keys.splice(i, 1)
                            if (this.values !== undefVals)
                                this.values.splice(i, 1)
                            tree.size--
                            i--
                            iHigh--
                        } else if (result.hasOwnProperty('value')) {
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
    mergeSibling(rhs: BNode<K, V>, _: number) {
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
    children: BNode<K, V>[]

    constructor(children: BNode<K, V>[], keys?: K[], txState: TransactionState) {

        if (!keys) {
            keys = []
            for (var i = 0; i < children.length; i++)
                keys[i] = children[i].maxKey()
        }
        super(keys)

        this.children = children
    }

    clone(): BNode<K, V> {
        let children = this.children.slice(0)
        for (var i = 0; i < children.length; i++)
            children[i].isShared = true
        return new BNodeInternal<K, V>(this.children.slice(0), this.keys.slice(0))
    }

    greedyClone(force?: boolean): BNode<K, V> {
        if (this.isShared && !force)
            return this
        let nu = new BNodeInternal<K, V>(this.children.slice(0), this.keys.slice(0))
        for (var i = 0; i < nu.children.length; i++)
            nu.children[i] = nu.children[i].greedyClone()
        return nu
    }

    minKey() {
        return this.children[0].minKey()
    }

    get(key: K, tree: BTree<K, V>): V | undefined {
        let i = this.indexOf(key, 0, tree.compare)
        let children = this.children
        return i < children.length ? children[i].get(key, tree) : undefined
    }

    checkValid(depth: number, tree: BTree<K, V>, baseIndex: number): number {
        let kL = this.keys.length
        let cL = this.children.length

        if (!(kL === cL)) throw new Error(`B+Tree: keys/children length mismatch: depth ${depth} lengths ${kL} ${cL} baseIndex ${baseIndex}`)
        if (!(kL > 1 || depth > 0)) throw new Error(`B+Tree: internal node has length ${kL} at depth ${depth} baseIndex ${baseIndex}`)

        let size = 0
        let c = this.children
        let k = this.keys
        let childSize = 0
        for (let i = 0; i < cL; i++) {
            size += c[i].checkValid(depth + 1, tree, baseIndex + size)
            childSize += c[i].keys.length
            if (!(size >= childSize)) {
                throw new Error(`B+Tree: child size ${childSize} is smaller than parent size ${size} at depth ${depth} baseIndex ${baseIndex}`)
            }
            if (!(i === 0 || c[i - 1].constructor === c[i].constructor)) {
                throw new Error(`B+Tree: child type mismatch at depth ${depth} baseIndex ${baseIndex}`)
            }
            if (c[i].maxKey() != k[i]) {
                throw new Error(`B+Tree: keys[${i}] is wrong, should be ${c[i].maxKey()} at depth ${depth} baseIndex ${baseIndex}`)
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
    set(key: K, value: V, overwrite: boolean | undefined, tree: BTree<K, V>): boolean | BNodeInternal<K, V> {
        var c = this.children, max = tree.maxNodeSize, cmp = tree.compare
        var i = Math.min(this.indexOf(key, 0, cmp), c.length - 1), child = c[i]

        if (child.isShared)
            c[i] = child = child.clone()
        if (child.keys.length >= max) {
            // child is full; inserting anything else will cause a split.
            // Shifting an item to the left or right sibling may avoid a split.
            // We can do a shift if the adjacent node is not full and if the
            // current key can still be placed in the same node after the shift.
            var other: BNode<K, V>
            if (i > 0 && (other = c[i - 1]).keys.length < max && cmp(child.keys[0], key) < 0) {
                if (other.isShared)
                    c[i - 1] = other = other.clone()
                other.takeFromRight(child)
                this.keys[i - 1] = other.maxKey()
            } else if ((other = c[i + 1]) !== undefined && other.keys.length < max && cmp(child.maxKey(), key) < 0) {
                if (other.isShared)
                    c[i + 1] = other = other.clone()
                other.takeFromLeft(child)
                this.keys[i] = c[i].maxKey()
            }
        }

        var result = child.set(key, value, overwrite, tree)
        if (result === false)
            return false
        this.keys[i] = child.maxKey()
        if (result === true)
            return true

        // The child has split and `result` is a new right child... does it fit?
        if (this.keys.length < max) { // yes
            this.insert(i + 1, result)
            return true
        } else { // no, we must split also
            var newRightSibling = this.splitOffRightSide(), target: BNodeInternal<K, V> = this
            if (cmp(result.maxKey(), this.maxKey()) > 0) {
                target = newRightSibling
                i -= this.keys.length
            }
            target.insert(i + 1, result)
            return newRightSibling
        }
    }

    insert(i: index, child: BNode<K, V>) {
        this.children.splice(i, 0, child)
        this.keys.splice(i, 0, child.maxKey())
    }

    splitOffRightSide() {
        var half = this.children.length >> 1
        return new BNodeInternal<K, V>(this.children.splice(half), this.keys.splice(half))
    }

    takeFromRight(rhs: BNode<K, V>) {
        // Reminder: parent node must update its copy of key for this node
        // assert: neither node is shared
        // assert rhs.keys.length > (maxNodeSize/2 && this.keys.length<maxNodeSize)
        this.keys.push(rhs.keys.shift()!)
        this.children.push((rhs as BNodeInternal<K, V>).children.shift()!)
    }

    takeFromLeft(lhs: BNode<K, V>) {
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
    forRange<R>(low: K, high: K, includeHigh: boolean | undefined, editMode: boolean, tree: BTree<K, V>, count: number,
        onFound?: (k: K, v: V, counter: number) => EditRangeResult<V, R> | void): EditRangeResult<V, R> | number {
        var cmp = tree.compare
        var keys = this.keys, children = this.children
        var iLow = this.indexOf(low, 0, cmp), i = iLow
        var iHigh = Math.min(high === low ? iLow : this.indexOf(high, 0, cmp), keys.length - 1)
        if (!editMode) {
            // Simple case
            for (; i <= iHigh; i++) {
                var result = children[i].forRange(low, high, includeHigh, editMode, tree, count, onFound)
                if (typeof result !== 'number')
                    return result
                count = result
            }
        } else if (i <= iHigh) {
            try {
                for (; i <= iHigh; i++) {
                    if (children[i].isShared)
                        children[i] = children[i].clone()
                    var result = children[i].forRange(low, high, includeHigh, editMode, tree, count, onFound)
                    // Note: if children[i] is empty then keys[i]=undefined.
                    //       This is an invalid state, but it is fixed below.
                    keys[i] = children[i].maxKey()
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
                    if (children[i].keys.length <= half) {
                        if (children[i].keys.length !== 0) {
                            this.tryMerge(i, tree.maxNodeSize)
                        } else { // child is empty! delete it!
                            keys.splice(i, 1)
                            children.splice(i, 1)
                        }
                    }
                }
                if (children.length !== 0 && children[0].keys.length === 0)
                    throw new Error("BUG: empty root node")
            }
        }
        return count
    }

    /** Merges child i with child i+1 if their combined size is not too large */
    tryMerge(i: index, maxSize: number): boolean {
        var children = this.children
        if (i >= 0 && i + 1 < children.length) {
            if (children[i].keys.length + children[i + 1].keys.length <= maxSize) {
                if (children[i].isShared) // cloned already UNLESS i is outside scan range
                    children[i] = children[i].clone()
                children[i].mergeSibling(children[i + 1], maxSize)
                children.splice(i + 1, 1)
                this.keys.splice(i + 1, 1)
                this.keys[i] = children[i].maxKey()
                return true
            }
        }
        return false
    }

    mergeSibling(rhs: BNode<K, V>, maxNodeSize: number) {
        // assert !this.isShared;
        var oldLength = this.keys.length
        this.keys.push.apply(this.keys, rhs.keys)
        this.children.push.apply(this.children, (rhs as any as BNodeInternal<K, V>).children)
        // If our children are themselves almost empty due to a mass-delete,
        // they may need to be merged too (but only the oldLength-1 and its
        // right sibling should need this).
        this.tryMerge(oldLength - 1, maxNodeSize)
    }
}

let undefVals: any[] = []