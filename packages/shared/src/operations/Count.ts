import JSONObject from '../utils/JSONObject'
import { BaseOperation } from './BaseOperation'

export interface Count extends BaseOperation {
    op: 'Count'
    query: JSONObject
}

export interface CountResponse {
    count: number
}