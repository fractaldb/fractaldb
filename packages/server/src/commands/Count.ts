import { Count, CountResponse } from '@fractaldb/shared/operations/Count'
import { Transaction } from '../layers/transaction/Transaction'

export async function CountCommand (op: Count, tx: Transaction): Promise<CountResponse> {
    return await tx.count(op.query)
}