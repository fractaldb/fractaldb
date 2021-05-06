type internalID = number
type entityID = string
type EntityObj = {
    entityID: entityID,
    doc: JSONObject
}
type Entity = { internalID: internalID } & EntityObj
type EntityMap = Map<internalID, EntityObj>
type InsertedID = {
    internalID: internalID,
    entityID: entityID
}

import JSONObject from '../utils/JSONObject'
import { BaseOperation } from './BaseOperation'

export interface FindMany extends BaseOperation {
    op: 'FindMany'
    query: JSONObject
    batchSize: Number
    closeCursor: boolean
    projection?: JSONObject
}

export interface FindManyResponse {
    cursorID: string
    entities: Entity[]
}

export interface FindManyMore extends BaseOperation {
    op: 'FindManyMore'
    cursorID: string
}

export interface FindManyMoreResponse {
    entities: Entity[]
}