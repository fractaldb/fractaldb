import DatabaseManager from '../../../managers/DatabaseManager.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreCollection from './InMemoryLogStoreCollection.js'


export default class InMemoryLogStoreDatabase {
    name: string
    store: InMemoryLogStore
    collections: Map<string, InMemoryLogStoreCollection | null> = new Map()

    constructor(store: InMemoryLogStore, name: string) {
        this.store = store
        this.name = name
    }
}