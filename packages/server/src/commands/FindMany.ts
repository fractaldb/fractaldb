import { FindMany, FindManyResponse } from '@fractaldb/shared/src/operations/FindMany'
import { Transaction } from '../db/Transaction'

export async function FindManyCommand (op: FindMany, tx: Transaction): Promise<FindManyResponse> {
    return {
        cursorID: '',
        entities: await tx.findMany(op.query)
    }
}