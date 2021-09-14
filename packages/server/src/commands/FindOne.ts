import { FindOne, FindOneResponse } from '@fractaldb/shared/operations/FindOne.js'
import Transaction from '../layers/transaction/Transaction'

export async function FindOneCommand (op: FindOne, tx: Transaction): Promise<FindOneResponse> {
    return {
        entity: await tx.findOne(op.query)
    }
}