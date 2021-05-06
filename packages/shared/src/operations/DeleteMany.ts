import JSONObject from '../utils/JSONObject'
import { BaseOperation } from './BaseOperation'

export interface DeleteMany extends BaseOperation {
    op: 'DeleteMany'
    query: JSONObject
}

export interface DeleteManyResponse {
    deletedCount: number
}