import { CommitTransaction, CommitTransactionResponse } from '@fractaldb/shared/src/operations/CommitTransaction'
import { Transaction } from '../db/Transaction'

export async function CommitTransactionCommand (op: CommitTransaction, tx: Transaction): Promise<CommitTransactionResponse> {
    await tx.commit()

    return {
        txID: tx.id
    }
}