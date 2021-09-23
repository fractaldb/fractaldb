import { FractalServer } from '../../database/Server.js'
import MockPower from './MockPower.js'
import InMemoryLogStore from '../inMemoryLogStore/InMemoryLogStore.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import InMemoryLogStoreDatabase from '../inMemoryLogStore/InMemoryLogStoreDatabase.js'
import InMemoryLogStoreCollection from '../inMemoryLogStore/InMemoryLogStoreCollection.js'
import { SubcollectionOpts } from '../../interfaces/Options.js'
import AllocatesIDsInterface from '../../interfaces/AllocatesIDsInterface.js'

export default class MockSubcollection<V> implements AllocatesIDsInterface {
    server: FractalServer
    opts: SubcollectionOpts
    powers: Map<number, MockPower<V>> = new Map()

    constructor(server: FractalServer, opts: SubcollectionOpts) {
        this.server = server
        this.opts = opts
    }

    predicate<X>(cb: (layer?: SubcollectionInterface<V>) => X){
        let log : InMemoryLogStore | undefined = this.mockLayer.mostRecentLogStore

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

    createLayerInMostRecentLogStore() {
        let log = this.mockLayer.mostRecentLogStore

        // get the oldest layer in order to initialise the new layer
        let oldestLayer = this.predicate<SubcollectionInterface<V> | undefined>(layer => layer)

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
        let subcollection = collection[this.opts.subcollection] as SubcollectionInterface<V>

        if(subcollection !== oldestLayer) {

        }

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
        throw new Error('Not yet implemented')
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