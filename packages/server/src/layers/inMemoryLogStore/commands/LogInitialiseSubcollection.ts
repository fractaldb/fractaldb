import { InitialiseSubcollection } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../InMemoryLogStoreDatabase.js'


export function LogInitialiseSubcollection(logStore: InMemoryLogStore, command: InitialiseSubcollection): void {
    const [type, database, collection, subcollection, highestID, freeIDs] = command

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

    subcoll.highestID = highestID
    subcoll.freeIDs = new Set(freeIDs)

    subcoll.initialised = true
}