import { PropertyMap } from '@fractaldb/indexing-system/indexes/PropertyMap.js'
import { IndexSet, IndexSetResponse } from '@fractaldb/shared/operations/IndexSet.js'
import { IndexTypes } from '@fractaldb/shared/structs/DataTypes.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function IndexSetCommand (op: IndexSet, tx: Transaction): Promise<IndexSetResponse> {
    let db = tx.getOrCreateDatabase(op.database)
    let collection = db.getOrCreateCollection(op.collection)
    let index = await collection.index.getOrInstantiate(op.index) as PropertyMap
    if(!index) {
        throw new Error('Index not found')
    }
    if(index.type !== IndexTypes.propertyMap) {
        throw new Error('Index is not a property map')
    }
    // create the value that stores the value of the set operation
    let valueID = await collection.value.allocateID()
    let [type, value] = op.data
    await collection.value.setActual(valueID, value)
    await index.set(op.key, [type, valueID])
    return {}
}