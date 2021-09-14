import { FractalServer } from '../../database/Server.js'
import InMemoryLogStoreSubcollection from './LogStore/InMemoryLogStoreSubcollection.js'


export default class InMemoryMockSubcollection<V> {
    server: FractalServer
    db: string
    collection: string
    name: string

    constructor(server: FractalServer, db: string, collection: string, name: string) {
        this.server = server;
        this.db = db;
        this.collection = collection;
        this.name = name;
    }

    get inMemoryLayer () {
        return this.server.inMemoryLayer
    }

    get realSubcollection() {
        const db = this.inMemoryLayer.mostRecentLogStore.getDatabase(this.db)
        if(!db) {
            return null;
        }
        const collection = db.getCollection(this.collection)
        if(!collection) {
            return null
        }
        return (collection as any)[this.name] as InMemoryLogStoreSubcollection<V>
    }

    async get(id: number): Promise<V | null> {
        let collection = this.realSubcollection
        if(!collection) {
            return null
        }
        return await collection.get(id)
    }

    // technically, this is a write operation so should be implemented differently in commit process
    // async remove(id: string): Promise<void> {
    //     let collection = this.realSubcollection
    //     if(!collection) {
    //         return null
    //     }
    //     return await collection.remove(id)
    // }
}