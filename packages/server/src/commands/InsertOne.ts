import { InsertOne, InsertOneResponse } from '@fractaldb/shared/operations/InsertOne.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function InsertOneCommand (op: InsertOne, tx: Transaction): Promise<InsertOneResponse> {
    return tx.insertOne(op.doc)
}