import { SetSubcollectionData } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../InMemoryLogStoreDatabase.js'


export function LogSetSubcollectionData(logStore: InMemoryLogStore, command: SetSubcollectionData): void {
    const [type, database, collection, subcollection, id, data] = command

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

    subcoll.items.set(id, logStore.server.adn.serialize(data))
    subcoll.usedIDs.delete(id)
}