import { UpdateOperation } from '../utils/JSONPatch'
import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'

export interface UpdateOne extends BaseOperation {
    op: 'UpdateOne'
    query: Entity
    updateOps: UpdateOperation[]
}

export interface UpdateOneResponse {
    updatedCount: number
}