import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'
import { EntityID } from '@fractaldb/adn/EntityID'

export interface InsertMany extends BaseOperation {
    op: 'InsertMany'
    docs: Entity[]
}

export interface InsertManyResponse {
    insertedIDs: EntityID[]
}