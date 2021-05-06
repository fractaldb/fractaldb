import { BaseOperation } from './BaseOperation'

export interface CommitTransaction extends BaseOperation {
    op: 'CommitTransaction'
    txID: string
}

export interface CommitTransactionResponse {
    txID: string
}