import { BNodeUnionData, IndexData, NodeData, ValueData } from '../structures/Subcollection'
import { SubcollectionInterface } from './SubcollectionInterface'

export default interface CollectionInterface {
    bnode: SubcollectionInterface<BNodeUnionData>
    index: SubcollectionInterface<IndexData>
    value: SubcollectionInterface<ValueData>
    node: SubcollectionInterface<NodeData>
}