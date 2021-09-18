import { FractalServer } from '../../database/Server.js'
import InMemoryMockCollection from './InMemoryMockCollection.js'

export default class InMemoryMockDatabase {
    collections: Map<string, InMemoryMockCollection | null> = new Map()
    server: FractalServer
    name: string

    constructor(server: FractalServer, name: string) {
        this.server = server
        this.name = name
    }

    getOrCreateMockCollection(collectionName: string): InMemoryMockCollection {
        let collection = this.collections.get(collectionName)
        if (!collection) {
            collection = new InMemoryMockCollection(this.server, this.name, collectionName)
            this.collections.set(collectionName, collection)
        }
        return collection
    }
}