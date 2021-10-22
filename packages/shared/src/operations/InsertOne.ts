import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'
import { EntityID } from '@fractaldb/adn/EntityID.js'

export interface InsertOne extends BaseOperation {
    op: 'InsertOne'
    doc: Entity
}

export interface InsertOneResponse extends EntityID {}