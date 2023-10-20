import { BaseOperation } from './BaseOperation.js'

export interface CommitTransaction extends BaseOperation {
    op: 'CommitTransaction'
    txID: string
}

export interface CommitTransactionResponse {
    txID: string
}