import { FractalServer } from '../../database/Server.js'
import InMemoryLogStoreSubcollection from './LogStore/InMemoryLogStoreSubcollection.js'
import InMemoryMockPower from './InMemoryMockPower.js'
import { RecordValue } from '../../structures/DataStructures.js'
import InMemoryLogStore from './LogStore/InMemoryLogStore.js'
import ManagesItems from './LogStore/abstract/ManagesItems.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'

export default class InMemoryMockSubcollection<V> {
    server: FractalServer
    db: string
    collection: string
    name: string
    powers: Map<number, InMemoryMockPower<V>> = new Map()

    get items() {
        let log : InMemoryLogStore | undefined = this.inMemoryLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let value = this.getThisLayer(log)?.items

            if(value !== undefined) return value
            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }

    predicate<X>(cb: (layer: InMemoryLogStoreSubcollection<V>) => X){
        let log : InMemoryLogStore | undefined = this.inMemoryLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let layer = this.getThisLayer(log)

            if(layer) {

            }
            let result = cb(layer)
            if(result) return result

            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }

    get freeIDs(){
        let log : InMemoryLogStore | undefined = this.inMemoryLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let value = this.getThisLayer(log)?.freeIDs

            if(value !== undefined) return value
            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }

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
            let value = this.getThisLayer(log)?.items.get(id)

            if(value !== undefined) return value
            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }

    getThisLayer(older: InMemoryLogStore) {
        return (older
            ?.databases.get(this.db)
            ?.collections.get(this.collection) as any)
            ?.[this.name] as SubcollectionInterface<V> | undefined
    }
}