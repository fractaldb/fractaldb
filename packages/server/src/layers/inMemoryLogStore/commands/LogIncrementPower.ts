import { IncrementPowerHighestID } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../InMemoryLogStoreDatabase.js'
import InMemoryLogStorePower from '../InMemoryLogStorePower.js'

export function LogIncrementPower(logStore: InMemoryLogStore, command: IncrementPowerHighestID){
    const [type, database, collection, subcollection, power] = command

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

    if(!pow.initialised) {
        throw new Error(`Power ${power} for subcollection ${subcollection} has not been initialised`)
    }
    pow.highestID++
}