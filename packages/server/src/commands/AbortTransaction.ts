import { AbortTransaction, AbortTransactionResponse } from '@fractaldb/shared/src/operations/AbortTransaction'
import { Transaction } from '../db/Transaction'

export async function AbortTransactionCommand (op: AbortTransaction, tx: Transaction): Promise<AbortTransactionResponse> {
    await tx.abort()

    return {
        txID: tx.id
    }
}