import { NodeStruct } from '../structs/NodeStruct.js'
import { BaseOperation } from './BaseOperation.js'

export interface FindOne extends BaseOperation {
    op: 'FindOne'
    database: string
    collection: string
    query: any
}

export interface FindOneResponse {
    node: NodeStruct | null
}