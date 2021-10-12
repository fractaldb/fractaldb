import { RemoveRootIndex } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../InMemoryLogStoreDatabase.js'

export function RemoveRootIndexCommand(logStore: InMemoryLogStore, command: RemoveRootIndex){
    let [type, database, collection, index] = command

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

    coll.addedRootIndexes.delete(index)
    coll.removedRootIndexes.add(index)
    coll.mock.rootIndexes.delete(index)
}