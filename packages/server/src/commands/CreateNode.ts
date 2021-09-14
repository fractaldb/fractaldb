
import { CreateNode, CreateNodeResponse } from '@fractaldb/shared/operations/CreateNode.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function CreateNodeCommand (op: CreateNode, tx: Transaction): Promise<CreateNodeResponse> {
    return await tx.getOrCreateDatabase(op.database).createNode(op.collection)
}