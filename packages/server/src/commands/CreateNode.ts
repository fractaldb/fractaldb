
import { CreateNode, CreateNodeResponse } from '@fractaldb/shared/operations/CreateNode.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function CreateNodeCommand (op: CreateNode, tx: Transaction): Promise<CreateNodeResponse> {
    let db = tx.getOrCreateDatabase(op.database)
    let collection = db.getOrCreateCollection(op.collection)
    let node = collection.createNode()
    return node
}