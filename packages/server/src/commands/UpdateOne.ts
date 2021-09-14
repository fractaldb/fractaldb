import { UpdateOne, UpdateOneResponse } from '@fractaldb/shared/operations/UpdateOne.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function UpdateOneCommand (op: UpdateOne, tx: Transaction): Promise<UpdateOneResponse> {
    return tx.updateOne(op.query, op.updateOps)
}