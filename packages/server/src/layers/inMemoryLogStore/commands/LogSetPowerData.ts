import { SetPowerOfData } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../InMemoryLogStoreDatabase.js'
import InMemoryLogStorePower from '../InMemoryLogStorePower.js'


export function LogSetPowerData(logStore: InMemoryLogStore, command: SetPowerOfData): void {
    const [type, database, collection, subcollection, power, id, data] = command

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
    if(!pow) {
        pow = new InMemoryLogStorePower(logStore, { database, collection, subcollection, power })
        subcoll.powers.set(power, pow)
    }

    if(data === null) {
        pow.freed.add(id)
        pow.used.delete(id)
        pow.mock.freeIDs.add(id)
        pow.mock.usedIDs.delete(id)
    } else {
        pow.used.add(id)
        pow.freed.delete(id)
        pow.mock.usedIDs.delete(id)
        pow.mock.freeIDs.delete(id)
    }
    pow.items.set(id, logStore.server.adn.serialize(data))
}