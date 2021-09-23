import { FractalServer } from '../../database/Server.js'
import { DatabaseOpts } from '../../interfaces/Options.js'
import MockCollection from './MockCollection.js'

export default class MockDatabase {
    collections: Map<string, MockCollection | null> = new Map()
    server: FractalServer
    opts: DatabaseOpts

    constructor(server: FractalServer, opts: DatabaseOpts) {
        this.server = server
        this.opts = opts
    }

    getOrCreateMockCollection(collectionName: string): MockCollection {
        let collection = this.collections.get(collectionName)
        if (!collection) {
            collection = new MockCollection(this.server, {...this.opts, collection: collectionName})
            this.collections.set(collectionName, collection)
        }
        return collection
    }
}