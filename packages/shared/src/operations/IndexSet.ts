import { IndexOperation } from '../structs/DataTypes.js'
import { BaseOperation } from './BaseOperation.js'

export interface IndexSet extends BaseOperation {
    op: 'IndexSet'
    database: string
    collection: string
    index: number
    key: string
    data: IndexOperation
}

export interface IndexSetResponse {

}