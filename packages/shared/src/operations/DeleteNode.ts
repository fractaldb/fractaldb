import { BaseOperation } from './BaseOperation.js'

export interface DeleteNode extends BaseOperation {
    op: 'DeleteNode'
    database: string
    collection: string
    node: number // id of the node
}

export interface DeleteNodeResponse {
    // database: string
    // collection: string
    id: number // id of the node deleted
}