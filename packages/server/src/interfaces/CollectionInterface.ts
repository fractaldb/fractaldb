import { BNodeUnionData, IndexDataUnion, NodeData, ValueData } from '../structures/Subcollection'
import { SubcollectionInterface } from './SubcollectionInterface'

export default interface CollectionInterface {
    bnode: SubcollectionInterface<BNodeUnionData<any>>
    index: SubcollectionInterface<IndexDataUnion>
    value: SubcollectionInterface<ValueData>
    node: SubcollectionInterface<NodeData>
}