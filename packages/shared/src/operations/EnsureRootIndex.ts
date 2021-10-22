import { IndexTypes } from '../structs/DataTypes.js'
import { BaseOperation } from './BaseOperation.js'

export interface EnsureRootIndex extends BaseOperation {
    op: 'EnsureRootIndex'
    database: string
    collection: string
    type: IndexTypes.property | IndexTypes.unique
    path: (number|string)[]
    background: boolean
}

export interface EnsureRootIndexResponse {
    id: number // id of the index created/found
}