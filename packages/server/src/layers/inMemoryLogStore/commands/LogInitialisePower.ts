import { InitialisePower } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../InMemoryLogStoreDatabase.js'
import InMemoryLogStorePower from '../InMemoryLogStorePower.js'


export function LogInitialisePower(logStore: InMemoryLogStore, command: InitialisePower): void {
    const [type, database, collection, subcollection, power, highestID, freeIDs] = command

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

    let pow = subcoll.powers.get(power)
    if (!pow) {
        pow = new InMemoryLogStorePower(logStore, { database, collection, subcollection, power})
        subcoll.powers.set(power, pow)
    }

    pow.highestID = highestID
    pow.freeIDs = new Set(freeIDs)

    pow.initialised = true
}