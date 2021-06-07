import { Entity } from '../utils/Entity'
import { EntityID } from '@framework-tools/adn/EntityID'
import { BaseOperation } from './BaseOperation'

export interface InsertMany extends BaseOperation {
    op: 'InsertMany'
    docs: Entity[]
}

export interface InsertManyResponse {
    insertedIDs: EntityID[]
}