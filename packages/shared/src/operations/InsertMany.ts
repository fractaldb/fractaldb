import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'
import { EntityID } from '@fractaldb/adn/EntityID.js'

export interface InsertMany extends BaseOperation {
    op: 'InsertMany'
    docs: Entity[]
}

export interface InsertManyResponse {
    insertedIDs: EntityID[]
}