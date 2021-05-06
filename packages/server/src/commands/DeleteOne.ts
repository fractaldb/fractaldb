import { DeleteOne, DeleteOneResponse } from '@fractaldb/shared/src/operations/DeleteOne'
import { Transaction } from '../db/Transaction'

export async function DeleteOneCommand (op: DeleteOne , tx: Transaction): Promise<DeleteOneResponse> {
    return tx.deleteOne(op.query)
}