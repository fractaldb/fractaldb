import TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import { IndexDataUnion, IndexTypes } from '@fractaldb/fractal-server/structures/Subcollection.js'
import BTree, { Comparator } from '../BTree.js'

export class PropertyMap<K, V> extends BTree<K, V> {

    // stores the id of the node that owns this index, used for ensuring that updates trigger root index updates on this node
    node: number

    constructor(txState: TransactionCollection, id: number, root: number, node: number, size: number, maxNodeSize?: number, compare?: Comparator<K>) {
        super(txState, id, root, size, maxNodeSize, compare)
        this.node = node
    }

    deinstantiate(): IndexDataUnion {
        return [IndexTypes.propertyMap, this.root, this.node, this.size]
    }
}