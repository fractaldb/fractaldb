import { UpdateOperation } from '../utils/JSONPatch'
import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'

export interface UpdateMany extends BaseOperation {
    op: 'UpdateMany'
    query: Entity
    updateOps: UpdateOperation[]
}

export interface UpdateManyResponse {
    updatedCount: number
}