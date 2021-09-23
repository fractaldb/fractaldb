import InMemoryLogStore from '../layers/inMemoryLogStore/InMemoryLogStore.js'
import { FractalServer } from './Server.js'
/*

- update status of in memory log store to persisting
- write all in memory log store to disk
- get the next most recent in memory log store and remove itself from the list

*/


export enum PersistenceEngineStatus {
    WAITING,
    PERSISTING
}

export default class PersistenceEngine {
    leastRecentLogStore!: InMemoryLogStore
    status: PersistenceEngineStatus
    server: FractalServer

    constructor(server: FractalServer) {
        this.server = server
        this.status = PersistenceEngineStatus.WAITING
    }

    /**
     * Ensure that await storageEngine.initialise() is called before thos
     */
    async initialize() {
        await this.persist()
    }

    async persist() {
        while(this.leastRecentLogStore.isFull) {
            this.status = PersistenceEngineStatus.PERSISTING

            await this.write(this.leastRecentLogStore)

            // close the file handler for the old log store
            await this.leastRecentLogStore.close()

            // set the least recent log store to the newer log store
            this.leastRecentLogStore = this.leastRecentLogStore.newer as InMemoryLogStore

            // unlink the older log store so it can be garbage collected
            this.leastRecentLogStore.older = undefined
        }
        this.status = PersistenceEngineStatus.WAITING
    }

    async write(logStore: InMemoryLogStore) {
        console.log('write called')
    }
}