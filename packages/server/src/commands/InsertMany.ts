import { InsertMany, InsertManyResponse } from '@fractaldb/shared/operations/InsertMany.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function InsertManyCommand (op: InsertMany , tx: Transaction): Promise<InsertManyResponse> {
    return tx.insertMany(op.docs)
}