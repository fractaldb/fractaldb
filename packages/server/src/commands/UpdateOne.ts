import { UpdateOne, UpdateOneResponse } from '@fractaldb/shared/operations/UpdateOne'
import { Transaction } from '../db/Transaction'

export async function UpdateOneCommand (op: UpdateOne, tx: Transaction): Promise<UpdateOneResponse> {
    return tx.updateOne(op.query, op.updateOps)
}