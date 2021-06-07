import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'

export interface FindOne extends BaseOperation {
    op: 'FindOne'
    query: any
    projection: any
}

export interface FindOneResponse {
    entity: Entity | null
}