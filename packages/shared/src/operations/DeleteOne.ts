import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'

export interface DeleteOne extends BaseOperation {
    op: 'DeleteOne'
    query: Entity
}

export interface DeleteOneResponse {
    deletedCount: number
}