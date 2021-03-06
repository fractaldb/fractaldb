import { InsertMany, InsertManyResponse } from '@fractaldb/shared/src/operations/InsertMany'
import { Transaction } from '../db/Transaction'

export async function InsertManyCommand (op: InsertMany , tx: Transaction): Promise<InsertManyResponse> {
    return tx.insertMany(op.docs)
}