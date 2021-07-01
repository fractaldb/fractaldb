import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'

export interface FindMany extends BaseOperation {
    op: 'FindMany'
    query: any
    batchSize: Number
    closeCursor: boolean
    projection?: any
}

export interface FindManyResponse {
    cursorID: string
    entities: Entity[]
}

export interface FindManyMore extends BaseOperation {
    op: 'FindManyMore'
    cursorID: string
}

export interface FindManyMoreResponse {
    entities: Entity[]
}