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
}