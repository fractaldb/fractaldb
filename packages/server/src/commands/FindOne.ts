import { FindOne, FindOneResponse } from '@fractaldb/shared/operations/FindOne'
import { Transaction } from '../db/Transaction'

export async function FindOneCommand (op: FindOne, tx: Transaction): Promise<FindOneResponse> {
    return {
        entity: await tx.findOne(op.query)
    }
}