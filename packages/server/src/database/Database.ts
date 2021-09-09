import { CollectionManager } from '../collection/CollectionManager.js'
import { Transaction } from '../layers/transaction/Transaction.js'
import { FractalServer } from './Server.js'

export class Database {
    collections: Map<string, CollectionManager> = new Map()
    server: FractalServer

    freeIds: Set<number> = new Set()
    nextHighestId: number

    /** IDs allocated to transactions running currently **/
    allocatedIds: Set<number> = new Set()

    constructor(nextHighestId: number, server: FractalServer) {
        this.nextHighestId = nextHighestId
        this.server = server
    }

    async getFreeId(tx: Transaction) {
        if(this.freeIds.size === 0) {
            this.nextHighestId++
            this.allocatedIds.add(this.nextHighestId)
            return this.nextHighestId - 1
        }
        let id = this.freeIds.values().next().value
        this.freeIds.delete(id)
        this.allocatedIds.add(id)
        return id
    }

    async getIndex(id: number) {

    }

    async getBNode(id: number) {

    }
}