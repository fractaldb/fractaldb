import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'
import { EntityID } from '@framework-tools/adn/EntityID'

export interface InsertOne extends BaseOperation {
    op: 'InsertOne'
    doc: Entity
}

export interface InsertOneResponse extends EntityID {}