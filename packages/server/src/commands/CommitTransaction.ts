import { CommitTransaction, CommitTransactionResponse } from '@fractaldb/shared/operations/CommitTransaction.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function CommitTransactionCommand (op: CommitTransaction, tx: Transaction): Promise<CommitTransactionResponse> {
    await tx.commit()

    return {
        txID: tx.id
    }
}