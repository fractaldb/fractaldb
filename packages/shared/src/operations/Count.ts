import { Entity } from '../utils/Entity'
import { BaseOperation } from './BaseOperation'

export interface Count extends BaseOperation {
    op: 'Count'
    query: Entity
}

export interface CountResponse {
    count: number
}