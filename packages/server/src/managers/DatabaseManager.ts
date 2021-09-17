import { CollectionManager } from './CollectionManager.js'
import { FractalServer } from '../database/Server.js'
import InMemoryMockDatabase from '../layers/inmemory/InMemoryMockDatabase.js'

export default class DatabaseManager {
    collections: Map<string, CollectionManager> = new Map()
    server: FractalServer
    name: string // database name
    inMemoryLayer: InMemoryMockDatabase

    constructor(server: FractalServer, name: string) {
        this.server = server
        this.name = name
        this.inMemoryLayer = this.server.inMemoryLayer.getOrCreateMockDatabase(name, this)
    }

    getOrCreateCollectionManager(name: string): CollectionManager {
        let collectionManager = this.collections.get(name)
        if (!collectionManager) {
            collectionManager = new CollectionManager(this.server, this.inMemoryLayer, this.name, name)
            this.collections.set(name, collectionManager)
        }
        return collectionManager
    }
}