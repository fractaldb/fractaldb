import { Entity } from '../utils/Entity.js'
import { BaseOperation } from './BaseOperation.js'

export interface Count extends BaseOperation {
    op: 'Count'
    query: Entity
}

export interface CountResponse {
    count: number
}