import { InsertMany, InsertManyResponse } from '@fractaldb/shared/operations/InsertMany'
import { Transaction } from '../layers/transaction/Transaction'

export async function InsertManyCommand (op: InsertMany , tx: Transaction): Promise<InsertManyResponse> {
    return tx.insertMany(op.docs)
}