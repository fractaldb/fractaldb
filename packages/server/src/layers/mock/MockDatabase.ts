import { FractalServer } from '../../database/Server.js'
import { DatabaseOpts } from '../../interfaces/Options.js'
import MockCollection, { CollectionInfo } from './MockCollection.js'

export type DatabaseInfo = {
    collections: Map<string, CollectionInfo>
}
export default class MockDatabase {
    collections: Map<string, MockCollection | null> = new Map()
    server: FractalServer
    opts: DatabaseOpts

    constructor(server: FractalServer, opts: DatabaseOpts, databaseInfo: DatabaseInfo) {
        this.server = server
        this.opts = opts
        for (const [collection, collectionInfo] of databaseInfo.collections) {
            this.collections.set(collection, new MockCollection(this.server, {...opts, collection}, collectionInfo))
        }
    }

    getOrCreateMockCollection(collectionName: string): MockCollection {
        let collection = this.collections.get(collectionName)
        if (!collection) {
            collection = new MockCollection(this.server, {...this.opts, collection: collectionName}, getEmptyCollectionInfo())
            this.collections.set(collectionName, collection)
        }
        return collection
    }
}

export function getEmptyCollectionInfo(): CollectionInfo {
    return {
        bnode: {
            freeIDs: new Set(),
            highestID: 0,
            usedIDs: new Set(),
            powers: new Map(),
        },
        node: {
            freeIDs: new Set(),
            highestID: 0,
            usedIDs: new Set(),
            powers: new Map(),
        },
        index: {
            freeIDs: new Set(),
            highestID: 0,
            usedIDs: new Set(),
            powers: new Map(),
        },
        value: {
            freeIDs: new Set(),
            highestID: 0,
            usedIDs: new Set(),
            powers: new Map(),
        }
    }
}