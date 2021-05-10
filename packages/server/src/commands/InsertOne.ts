import { InsertOne, InsertOneResponse } from '@fractaldb/shared/operations/InsertOne'
import { Transaction } from '../db/Transaction'

export async function InsertOneCommand (op: InsertOne, tx: Transaction): Promise<InsertOneResponse> {
    return tx.insertOne(op.doc)
}