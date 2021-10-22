import { StartTransaction, StartTransactionResponse } from '@fractaldb/shared/operations/StartTransaction.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function StartTransactionCommand (op: StartTransaction, tx: Transaction): Promise<StartTransactionResponse> {
    return {
        txID: tx.id
    }
}