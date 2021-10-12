import { PropertyMap } from '@fractaldb/indexing-system/indexes/PropertyMap.js'
import { IndexGet, IndexGetResponse} from '@fractaldb/shared/operations/IndexGet.js'
import { IndexTypes } from '@fractaldb/shared/structs/DataTypes.js'
import Transaction from '../layers/transaction/Transaction.js'

export async function IndexGetCommand (op: IndexGet, tx: Transaction): Promise<IndexGetResponse> {
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

    let get = await index.get(op.key)
    if(!get) {
        return {}
    }
    let [type, valueID] = get

    return {
        type,
        value: await collection.value.getActual(valueID)
    }
}