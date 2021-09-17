import { FractalServer } from '../../database/Server.js'
import InMemoryLogStore from './LogStore/InMemoryLogStore.js'
import InMemoryLogStoreSubcollection from './LogStore/InMemoryLogStoreSubcollection.js'

export default class InMemoryMockPower<V> {
    server: FractalServer
    db: string
    collection: string
    subcollection: string
    power: number

    constructor(server: FractalServer, db: string, collection: string, subcollection: string, power: number) {
        this.server = server
        this.db = db
        this.collection = collection
        this.subcollection = subcollection
        this.power = power
    }

    get inMemoryLayer () {
        return this.server.inMemoryLayer
    }

    async get(id: number): Promise<V | null> {
        let log : InMemoryLogStore | undefined = this.inMemoryLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let value = ((log
                ?.databases.get(this.db)
                ?.collections.get(this.collection) as any)
                ?.[this.subcollection] as InMemoryLogStoreSubcollection<V>)
                ?.powers.get(this.power)
                ?.items.get(id)

            if(value !== undefined) return value
            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }
}