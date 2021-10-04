import { IncrementSubcollectionHighestID } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../InMemoryLogStoreDatabase.js'

export function LogIncrementSubcollection(logStore: InMemoryLogStore, command: IncrementSubcollectionHighestID){
    const [type, database, collection, subcollection] = command

    let db = logStore.databases.get(database)

    if (!db) {
        db = new InMemoryLogStoreDatabase(logStore, { database })
        logStore.databases.set(database, db)
    }
    let coll = db.collections.get(collection)
    if (!coll) {
        coll = new InMemoryLogStoreCollection(logStore, { database, collection })
        db.collections.set(collection, coll)
    }

    let subcoll = coll[subcollection]

    if(!subcoll.initialised) {
        throw new Error(`Subcollection ${subcollection} has not been initialised`)
    }
    subcoll.highestID++
}
