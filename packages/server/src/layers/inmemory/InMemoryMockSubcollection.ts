import { FractalServer } from '../../database/Server.js'
import InMemoryLogStoreSubcollection from './LogStore/InMemoryLogStoreSubcollection.js'
import InMemoryMockPower from './InMemoryMockPower.js'
import { RecordValue } from '../../structures/DataStructures.js'
import InMemoryLogStore from './LogStore/InMemoryLogStore.js'

export default class InMemoryMockSubcollection<V> {
    server: FractalServer
    db: string
    collection: string
    name: string
    powers: Map<number, InMemoryMockPower<V>> = new Map()

    constructor(server: FractalServer, db: string, collection: string, name: string) {
        this.server = server;
        this.db = db;
        this.collection = collection;
        this.name = name;
    }

    getOrCreateMockPower(power: number): InMemoryMockPower<V> {
        let powerClass = this.powers.get(power)
        if (!powerClass) {
            powerClass = new InMemoryMockPower(this.server, this.name, this.collection, this.name, power)
            this.powers.set(power, powerClass)
        }
        return powerClass
    }

    get inMemoryLayer () {
        return this.server.inMemoryLayer
    }

    async get(id: number): Promise<RecordValue | null> {
        let log : InMemoryLogStore | undefined = this.inMemoryLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let value = ((log
                ?.databases.get(this.db)
                ?.collections.get(this.collection) as any)
                ?.[this.name] as InMemoryLogStoreSubcollection<V>)
                ?.items.get(id)

            if(value !== undefined) return value
            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }
}