import { FractalServer } from '../index.js'
import InMemoryMockPower from '../layers/inmemory/InMemoryMockPower.js'
import InMemoryMockSubcollection from '../layers/inmemory/InMemoryMockSubcollection.js'
import IDManager from './abstract/IDManager.js'

export default class PowerManager<V> extends IDManager<V> {

    server: FractalServer
    db: string
    collection: string
    subcollection: string
    power: number
    inMemoryLayer: InMemoryMockPower<V>

    constructor(server: FractalServer, inMemoryLayer: InMemoryMockSubcollection<V>, db: string, collection: string, subcollection: string, power: number) {
        super([db, collection, subcollection])
        this.inMemoryLayer = inMemoryLayer.getOrCreateMockPower(power)
        this.server = server
        this.db = db
        this.collection = collection
        this.subcollection = subcollection
        this.power = power;
    }
}