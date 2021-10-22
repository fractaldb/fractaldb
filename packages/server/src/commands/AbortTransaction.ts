import { AbortTransaction, AbortTransactionResponse } from '@fractaldb/shared/operations/AbortTransaction.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function AbortTransactionCommand (op: AbortTransaction, tx: Transaction): Promise<AbortTransactionResponse> {
    await tx.abort()

    return {
        txID: tx.id
    }
}