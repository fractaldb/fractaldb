import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'

export interface DeleteOne extends BaseOperation {
    op: 'DeleteOne'
    query: Entity
}

export interface DeleteOneResponse {
    deletedCount: number
}