import { PersistenceEngineStatus } from '../../database/PersistenceEngine.js'
import { FractalServer } from '../../database/Server.js'
import InMemoryMockDatabase from './InMemoryMockDatabase.js'
import InMemoryLogStore from './LogStore/InMemoryLogStore.js'


export default class InMemoryLayer {
    databases: Map<string, InMemoryMockDatabase | null> = new Map()
    mostRecentLogStore!: InMemoryLogStore
    server: FractalServer

    constructor(server: FractalServer) {
        this.server = server
    }

    getOrCreateMockDatabase(databaseName: string): InMemoryMockDatabase {
        let database = this.databases.get(databaseName)
        if (!database) {
            database = new InMemoryMockDatabase(this.server, this.server.getOrCreateDatabaseManager(databaseName), databaseName)
            this.databases.set(databaseName, database)
        }
        return database
    }

    /**
     * find a free log in-memory store to write to:
        - if there is a most recent free log store, use it
        - if the log store is full, link it with a new future log store and make that the most recent
        - if the data persistence engine is waiting, notify the data persistence engine to restart
     */
    async findFreeLogStore(): Promise<InMemoryLogStore> {
        if (this.mostRecentLogStore.isFull) {
            let newNumber = this.mostRecentLogStore.number + 1
            const newLogStore = new InMemoryLogStore(this.server, newNumber)
            this.mostRecentLogStore.newer = newLogStore
            newLogStore.older = this.mostRecentLogStore
            this.mostRecentLogStore = newLogStore
            if (this.server.persistenceEngine.status === PersistenceEngineStatus.WAITING) {
                this.server.persistenceEngine.persist()
            }
        }
        this.mostRecentLogStore.txCount++
        return this.mostRecentLogStore
    }
}