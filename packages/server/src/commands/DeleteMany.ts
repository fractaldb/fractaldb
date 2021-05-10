import { DeleteMany, DeleteManyResponse } from '@fractaldb/shared/operations/DeleteMany'
import { Transaction } from '../db/Transaction'

export async function DeleteManyCommand (op: DeleteMany , tx: Transaction): Promise<DeleteManyResponse> {
    return await tx.deleteMany(op.query)
}