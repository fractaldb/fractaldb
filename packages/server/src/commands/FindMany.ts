import { FindMany, FindManyResponse } from '@fractaldb/shared/operations/FindMany.js'
import Transaction from '../layers/transaction/Transaction'

export async function FindManyCommand (op: FindMany, tx: Transaction): Promise<FindManyResponse> {
    return {
        cursorID: '',
        entities: await tx.findMany(op.query)
    }
}