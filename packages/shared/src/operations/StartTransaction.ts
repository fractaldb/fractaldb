import { BaseOperation } from './BaseOperation'

export interface StartTransaction extends BaseOperation {
    op: 'StartTransaction'
}

export interface StartTransactionResponse {
    txID: string
}