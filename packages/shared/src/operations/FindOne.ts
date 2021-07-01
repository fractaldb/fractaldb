import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'

export interface FindOne extends BaseOperation {
    op: 'FindOne'
    query: any
    projection: any
}

export interface FindOneResponse {
    entity: Entity | null
}