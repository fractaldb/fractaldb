
import { FractalServer } from '../database/Server.js'
import InMemoryMockCollection from '../layers/inmemory/InMemoryMockCollection.js'
import InMemoryMockSubcollection from '../layers/inmemory/InMemoryMockSubcollection.js'
import InMemoryLogStoreCollection from '../layers/inmemory/LogStore/InMemoryLogStoreCollection.js'
import { RecordValue } from '../structures/DataStructures.js'
import IDManager from './abstract/IDManager.js'
import PowerManager from './PowerManger.js'

/**
 * Subcollection is the base class for all subcollections
 *
 * There are a number of types of subcollections that use this class:
    * nodes: store the nodes of a collection
    * index: store the indexes which index the docs
    * index-power: arrays of indexes by their power of 2
    * bnodes: store the bnode data structure used by the index
    * bnode-power: arrays of bnodes by their power of 2
    * values-power: arrays of values by their power of 2
 *
 * Each have their own ID allocation systems (eg: there can be an index, bnode and docs all with the same ID)
 *
 * Subcollection is managed by the Database and keeps track of ID allocations, free ids, locks, etc.
 *
 * A subcollection is part of a collection.
 */
export class SubcollectionManager<V> extends IDManager<RecordValue> {
    server: FractalServer
    db: string
    collection: string
    name: string

    powers: Map<number, PowerManager<V>> = new Map()

    /**
     * The mock inMemoryLayer that represents this subcollection
     */
    inMemoryLayer: InMemoryMockSubcollection<V>

    constructor(server: FractalServer, inMemoryLayer: InMemoryMockSubcollection<V>, db: string, collection: string, name: string) {
        super([db, collection, name])
        this.server = server
        this.inMemoryLayer = inMemoryLayer

        this.db = db
        this.collection = collection
        this.name = name
    }

    getOrCreatePowerManager(power: number): PowerManager<V> {
        let powerManager = this.powers.get(power)
        if (!powerManager) {
            powerManager = new PowerManager(this.server, this.inMemoryLayer, this.db, this.collection, this.name, power)
            this.powers.set(power, powerManager)
        }
        return powerManager
    }
}