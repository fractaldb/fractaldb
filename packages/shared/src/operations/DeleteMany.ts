import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'

export interface DeleteMany extends BaseOperation {
    op: 'DeleteMany'
    query: Entity
}

export interface DeleteManyResponse {
    deletedCount: number
}