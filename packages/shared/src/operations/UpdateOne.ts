import { UpdateOperation } from '../utils/JSONPatch.js'
import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'

export interface UpdateOne extends BaseOperation {
    op: 'UpdateOne'
    query: Entity
    updateOps: UpdateOperation[]
}

export interface UpdateOneResponse {
    updatedCount: number
}