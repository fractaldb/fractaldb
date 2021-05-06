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

export interface InsertOne extends BaseOperation {
    op: 'InsertOne'
    doc: JSONObject
}

export interface InsertOneResponse extends InsertedID {}