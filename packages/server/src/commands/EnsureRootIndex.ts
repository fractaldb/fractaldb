import { EnsureRootIndex, EnsureRootIndexResponse } from '@fractaldb/shared/operations/EnsureRootIndex.js'
import { NodeStruct } from '@fractaldb/shared/structs/NodeStruct.js'
import { RootIndex } from '../interfaces/CollectionInterface.js'
import Transaction from '../layers/transaction/Transaction.js'
import TransactionCollection from '../layers/transaction/TransactionCollection.js'

/**
 * Background ensurerootindex operation implementation.
 *
 * add an index as a root index
 * setup a background operation that will loop through all the nodes in the collection and add them to the index if they should belong in it
 * this will lock indexes one by one and will create a new transaction per node being added to the index
 *
 */

function getCollection(tx: Transaction, database: string, collection: string) {
    let db = tx.getOrCreateDatabase(database)
    return db.getOrCreateCollection(collection)
}

export async function EnsureRootIndexCommand (op: EnsureRootIndex, tx: Transaction): Promise<EnsureRootIndexResponse> {
    let collection = getCollection(tx, op.database, op.collection)

    let indexID = await collection.ensureRootIndex(op.type, op.path)

    if(op.background) {
        tx.on('committed', async () => {
            let id = 1
            let nodeTx = tx.server.beginTx()
            let nodeCollection = getCollection(nodeTx, op.database, op.collection)
            let index = await nodeCollection.index.getOrInstantiate(indexID) as unknown as RootIndex

            while(id < collection.node.mock.highestID) {
                let nodedata = await collection.node.getActual(id)
                if(nodedata) {
                    let [properties, references] = nodedata
                    await addNodeToIndex(index, {id, properties, references})
                }
                id++
            }
        })
    } else {
        let id = 1
        let index = await collection.index.getOrInstantiate(indexID) as unknown as RootIndex
        while(id < collection.node.mock.highestID + 1) {
            let nodedata = await collection.node.getActual(id)
            if(nodedata) {
                let [properties, references] = nodedata
                await addNodeToIndex(index, {id, properties, references})
            }
            id++
        }
    }


    return {
        id: indexID
    }
}

async function addNodeToIndex (index: RootIndex, node: NodeStruct) {
    await index.prepareIndexes(node)
    let indexesToAddTo = await index.getIndexesFor(node)
    for(let [index, keyvalue] of indexesToAddTo) {
        await index.set(keyvalue, node.id)
    }
}