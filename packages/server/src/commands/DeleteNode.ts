import { DeleteNode, DeleteNodeResponse } from '@fractaldb/shared/operations/DeleteNode.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function DeleteNodeCommand (op: DeleteNode, tx: Transaction): Promise<DeleteNodeResponse> {
    let db = tx.getOrCreateDatabase(op.database)
    let collection = db.getOrCreateCollection(op.collection)
    return await collection.deleteNode(op.node)
}