import { BaseOperation } from './BaseOperation.js'

export interface StartTransaction extends BaseOperation {
    op: 'StartTransaction'
}

export interface StartTransactionResponse {
    txID: string
}