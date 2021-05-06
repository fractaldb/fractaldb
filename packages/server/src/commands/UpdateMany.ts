import { UpdateMany, UpdateManyResponse } from '@fractaldb/shared/src/operations/UpdateMany'
import { Transaction } from '../db/Transaction'

export async function UpdateManyCommand (op: UpdateMany, tx: Transaction): Promise<UpdateManyResponse> {
    return tx.updateMany(op.query, op.updateOps)
}