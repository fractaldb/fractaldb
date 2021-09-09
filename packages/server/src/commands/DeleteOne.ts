import { DeleteOne, DeleteOneResponse } from '@fractaldb/shared/operations/DeleteOne'
import { Transaction } from '../layers/transaction/Transaction'

export async function DeleteOneCommand (op: DeleteOne , tx: Transaction): Promise<DeleteOneResponse> {
    return tx.deleteOne(op.query)
}