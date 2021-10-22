import { IndexOperation } from '../structs/DataTypes.js'
import { BaseOperation } from './BaseOperation.js'

export interface IndexGet extends BaseOperation {
    op: 'IndexGet'
    database: string
    collection: string
    index: number
    key: string | number
}

export interface IndexGetResponse {
    type?: IndexOperation[0]
    value?: IndexOperation[1]
}