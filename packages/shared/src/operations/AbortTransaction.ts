import { BaseOperation } from './BaseOperation'

export interface AbortTransaction extends BaseOperation {
    txID: string
    op: 'AbortTransaction'
}

export interface AbortTransactionResponse {
    txID: string // returns the transactionID that's been aborted
}