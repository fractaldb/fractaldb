import DatabaseManager from '../../../managers/DatabaseManager.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreCollection from './InMemoryLogStoreCollection.js'


export default class InMemoryLogStoreDatabase {
    name: string
    inMemoryLogStore: InMemoryLogStore
    databaseManager: DatabaseManager
    collections: Map<string, InMemoryLogStoreCollection | null> = new Map()

    constructor(inMemoryLogStore: InMemoryLogStore, name: string) {
        this.inMemoryLogStore = inMemoryLogStore
        this.databaseManager = inMemoryLogStore.server.getOrCreateDatabaseManager(name)
        this.name = name
    }

    /**
     * This will get the collection for the given name.
     * If the collection is null, then it means it has been deleted.
     * If the collection is undefined, then it means it has not been created yet or belongs in a lower layer.
     */
    getCollection(name: string): InMemoryLogStoreCollection | null {
        const collection = this.collections.get(name)
        if (collection === undefined) {
            if(this.inMemoryLogStore.older) {
                let db = this.inMemoryLogStore.older.getDatabase(name)
                if(!db) {
                    return null
                }
                return db.getCollection(name)
            } else {
                throw new Error('Lower layer not implemented yet')
            }
        } else if (collection === null) {
            return null
        } else {
            return collection
        }
    }

    get server() {
        return this.inMemoryLogStore.server
    }
}