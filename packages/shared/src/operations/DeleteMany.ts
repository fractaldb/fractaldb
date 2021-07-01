import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'

export interface DeleteMany extends BaseOperation {
    op: 'DeleteMany'
    query: Entity
}

export interface DeleteManyResponse {
    deletedCount: number
}