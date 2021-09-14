import { CollectionManager } from './CollectionManager.js'
import InMemoryLayer from '../layers/inmemory/InMemoryLayer.js'
import { FractalServer } from '../database/Server.js'

export default class DatabaseManager {
    collections: Map<string, CollectionManager> = new Map()
    server: FractalServer
    name: string // database name

    constructor(server: FractalServer, name: string) {
        this.server = server
        this.name = name
    }

    getOrCreateCollectionManager(name: string): CollectionManager {
        let collectionManager = this.collections.get(name)
        if (!collectionManager) {
            collectionManager = new CollectionManager(this.server, this.name, name)
        }
        return collectionManager
    }
}