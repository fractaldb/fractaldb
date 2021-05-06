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


import  JSONObject  from '../utils/JSONObject'
import { BaseOperation } from './BaseOperation'

export interface InsertMany extends BaseOperation {
    op: 'InsertMany'
    docs: JSONObject[]
}

export interface InsertManyResponse {
    insertedIDs: InsertedID[]
}