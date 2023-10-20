import { UpdateOperation } from '../utils/JSONPatch.js'
import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'

export interface UpdateMany extends BaseOperation {
    op: 'UpdateMany'
    query: Entity
    updateOps: UpdateOperation[]
}

export interface UpdateManyResponse {
    updatedCount: number
}