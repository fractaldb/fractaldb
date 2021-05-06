import { UpdateOperation } from '../utils/JSONPatch'
import JSONObject from '../utils/JSONObject'
import { BaseOperation } from './BaseOperation'

export interface UpdateMany extends BaseOperation {
    op: 'UpdateMany'
    query: JSONObject
    updateOps: UpdateOperation[]
}

export interface UpdateManyResponse {
    updatedCount: number
}