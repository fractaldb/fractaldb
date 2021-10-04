import { BNodeUnionData, IndexDataUnion, NodeData, ValueData } from '../structures/Subcollection.js'
import { SubcollectionInterface } from './SubcollectionInterface.js'
import { PropertyBTree } from '@fractaldb/indexing-system/indexes/PropertyBTree.js'
import { UniqueBTree } from '@fractaldb/indexing-system/indexes/UniqueBTree.js'

export type RootIndex = PropertyBTree<any, any> | UniqueBTree<any>
export default interface CollectionInterface {
    bnode: SubcollectionInterface<BNodeUnionData<any>>
    index: SubcollectionInterface<IndexDataUnion>
    value: SubcollectionInterface<ValueData>
    node: SubcollectionInterface<NodeData>
}