import { Count, CountResponse } from '@fractaldb/shared/src/operations/Count'
import { Transaction } from '../db/Transaction'

export async function CountCommand (op: Count, tx: Transaction): Promise<CountResponse> {
    return await tx.count(op.query)
}