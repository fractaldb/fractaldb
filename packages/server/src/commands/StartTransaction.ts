import { StartTransaction, StartTransactionResponse } from '@fractaldb/shared/operations/StartTransaction'
import { Transaction } from '../layers/transaction/Transaction'

export async function StartTransactionCommand (op: StartTransaction, tx: Transaction): Promise<StartTransactionResponse> {
    return {
        txID: tx.id
    }
}