import { BaseOperation } from './BaseOperation.js'

export interface CreateNode extends BaseOperation {
    op: 'CreateNode'
    database: string
    collection: string
}

export interface CreateNodeResponse {
    // database: string
    // collection: string
    id: number, // id of the node
    properties: number, // ID of the properties index
    references: number // ID of the references index
}