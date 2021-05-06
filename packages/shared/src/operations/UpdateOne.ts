import { UpdateOperation } from '../utils/JSONPatch'
import JSONObject from '../utils/JSONObject'
import { BaseOperation } from './BaseOperation'

export interface UpdateOne extends BaseOperation {
    op: 'UpdateOne'
    query: JSONObject
    updateOps: UpdateOperation[]
}

export interface UpdateOneResponse {
    updatedCount: number
}