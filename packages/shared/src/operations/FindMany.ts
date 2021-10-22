import { NodeStruct } from '../structs/NodeStruct.js'
import { BaseOperation } from './BaseOperation.js'

export interface FindMany extends BaseOperation {
    op: 'FindMany'
    database: string
    collection: string
    query: any
    batchSize: number
    limit: number
    closeCursor: boolean
    projection?: any
}

export interface FindManyResponse {
    cursorID?: string
    nodes: NodeStruct[]
}

export interface FindManyMore extends BaseOperation {
    op: 'FindManyMore'
    cursorID: string
}

export interface FindManyMoreResponse {
    nodes: NodeStruct[]
}