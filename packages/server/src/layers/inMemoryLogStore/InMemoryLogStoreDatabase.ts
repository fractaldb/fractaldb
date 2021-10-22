import { DatabaseOpts } from '../../interfaces/Options.js'
import MockDatabase from '../mock/MockDatabase.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreCollection from './InMemoryLogStoreCollection.js'


export default class InMemoryLogStoreDatabase {
    opts: DatabaseOpts
    store: InMemoryLogStore
    mock: MockDatabase
    collections: Map<string, InMemoryLogStoreCollection | null> = new Map()

    constructor(store: InMemoryLogStore, opts: DatabaseOpts) {
        this.store = store
        this.mock = store.server.mockLayer.getOrCreateMockDatabase(opts.database)
        this.opts = opts
    }
}