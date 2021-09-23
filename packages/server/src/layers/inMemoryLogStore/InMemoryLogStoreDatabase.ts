import { DatabaseOpts } from '../../interfaces/Options.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreCollection from './InMemoryLogStoreCollection.js'


export default class InMemoryLogStoreDatabase {
    opts: DatabaseOpts
    store: InMemoryLogStore
    collections: Map<string, InMemoryLogStoreCollection | null> = new Map()

    constructor(store: InMemoryLogStore, opts: DatabaseOpts) {
        this.store = store
        this.opts = opts
    }
}