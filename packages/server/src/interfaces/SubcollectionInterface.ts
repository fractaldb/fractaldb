import { RecordValue } from '../structures/DataStructures.js'
import HasItemsInterface from './HasItemsInterface.js'
import PowerInterface from './PowerInterface.js'

export type Subcollections = 'nodes' | 'bnode' | 'index' | 'values'
export interface SubcollectionInterface<V> extends HasItemsInterface<RecordValue> {
    powers: Map<number, PowerInterface<V>>
}