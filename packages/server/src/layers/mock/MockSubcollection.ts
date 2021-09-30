import { FractalServer } from '../../database/Server.js'
import MockPower from './MockPower.js'
import InMemoryLogStore from '../inMemoryLogStore/InMemoryLogStore.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import InMemoryLogStoreDatabase from '../inMemoryLogStore/InMemoryLogStoreDatabase.js'
import InMemoryLogStoreCollection from '../inMemoryLogStore/InMemoryLogStoreCollection.js'
import { SubcollectionOpts } from '../../interfaces/Options.js'
import AllocatesIDsInterface from '../../interfaces/AllocatesIDsInterface.js'
import InMemoryLogStoreSubcollection from '../inMemoryLogStore/InMemoryLogStoreSubcollection.js'
import ManagesIDAllocation from '../../interfaces/ManagesIDAllocation.js'
import { Commands, IncrementSubcollectionHighestID, InitialiseSubcollection } from '../../logcommands/commands.js'

export default class MockSubcollection<V> implements AllocatesIDsInterface {
    server: FractalServer
    opts: SubcollectionOpts
    powers: Map<number, MockPower<V>> = new Map()

    constructor(server: FractalServer, opts: SubcollectionOpts) {
        this.server = server
        this.opts = opts
    }

    predicate<X>(cb: (layer?: SubcollectionInterface<V>) => X, startFrom?: InMemoryLogStore ){
        let log : InMemoryLogStore | undefined = startFrom ?? this.mockLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let layer = this.getThisLayer(log)

            if(layer) {
                let result = cb(layer)
                if(result !== undefined) return result
            }

            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }

    async getOrInitialiseSubcollectionInMostRecentLogStore() {
        let log = this.mockLayer.mostRecentLogStore

        let db = log.databases.get(this.opts.database)
        if (!db) {
            db = new InMemoryLogStoreDatabase(log, { database: this.opts.database })
            log.databases.set(this.opts.database, db)
        }
        let collection = db.collections.get(this.opts.collection)
        if (!collection) {
            collection = new InMemoryLogStoreCollection(log, { database: this.opts.database, collection: this.opts.collection })
            db.collections.set(this.opts.collection, collection)
        }
        let subcollection = collection[this.opts.subcollection] as unknown as InMemoryLogStoreSubcollection<V>
        if(!subcollection.initialised) {
            let nextMostRecent = log.older ? this.predicate<ManagesIDAllocation | undefined>(layer => layer instanceof ManagesIDAllocation ? layer : undefined, log.older) : undefined
            if(nextMostRecent) { // initialise based on last known values
                subcollection.freeIDs = new Set(nextMostRecent.freeIDs)
                subcollection.usedIDs = new Set(nextMostRecent.usedIDs)
                subcollection.highestID = nextMostRecent.highestID
            } // else just use the defaults
            let command: InitialiseSubcollection = [Commands.InitialiseSubcollection, this.opts.database, this.opts.collection, this.opts.subcollection, subcollection.highestID, [...subcollection.freeIDs, ...subcollection.usedIDs]]
            await log.applyTxCommands([command])
            subcollection.initialised = true
        }
        return subcollection
    }

    getOrCreateMockPower(power: number): MockPower<V> {
        let powerClass = this.powers.get(power)
        if (!powerClass) {
            powerClass = new MockPower(this.server, {...this.opts, power})
            this.powers.set(power, powerClass)
        }
        return powerClass
    }

    get mockLayer () {
        return this.server.mockLayer
    }

    async allocateID(): Promise<number> {
        let latest = await this.getOrInitialiseSubcollectionInMostRecentLogStore()

        if(latest.freeIDs.size === 0) {
            // log the fact that we're incrementing the highest ID, this is considered a write command
            let command: IncrementSubcollectionHighestID = [Commands.IncrementSubcollectionHighestID, this.opts.database, this.opts.collection, this.opts.subcollection]
            await this.mockLayer.mostRecentLogStore.applyTxCommands([command])
            let id = ++latest.highestID
            latest.usedIDs.add(id)
            return id
        } else {
            let id = [...latest.freeIDs][0]
            latest.freeIDs.delete(id)
            latest.usedIDs.add(id)
            return id
        }
    }

    getThisLayer(older: InMemoryLogStore) {
        return (older
            ?.databases.get(this.opts.database)
            ?.collections.get(this.opts.collection) as any)
            ?.[this.opts.subcollection] as SubcollectionInterface<V> | undefined
    }
}

// allocate algorithm
// 1. get the most recent log store
// 2. get or create layer for this subcollection
// 3. if the layer exists, return it
// 4. if the layer does not exist, create it, use predicate to get values for Instantiation


// tx wants to allocate id for a new item
// gets mock layer
//