import JSONObject from '../utils/JSONObject'
import { BaseOperation } from './BaseOperation'

export interface DeleteOne extends BaseOperation {
    op: 'DeleteOne'
    query: JSONObject
}

export interface DeleteOneResponse {
    deletedCount: number
}