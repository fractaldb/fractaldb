import { Commands, LogCommand } from '../../logcommands/index.js'
import DatabaseManager from '../../managers/DatabaseManager.js'
import InMemoryMockDatabase from '../inmemory/InMemoryMockDatabase.js'
import Transaction from './Transaction.js'
import TransactionCollection from './TransactionCollection.js'

export default class TransactionDatabase {
    database: InMemoryMockDatabase
    tx: Transaction
    collections: Map<string, TransactionCollection | null> = new Map()
    name: string

    constructor(tx: Transaction, database: InMemoryMockDatabase, name: string){
        this.database = database
        this.name = name
        this.tx = tx
    }

    getOrCreateCollection(name: string): TransactionCollection {
        let collection = this.collections.get(name)
        if(!collection) {
            collection = new TransactionCollection(this.tx, this.database.getOrCreateMockCollection(name), this.name, name)
            this.collections.set(name, collection)
        }
        return collection
    }

    getWrites(): LogCommand[] {
        let writes: LogCommand[] = []
        for(const [name, collection] of this.collections.entries()) {
            if(collection === null){
                writes.push([Commands.DeleteCollection, this.database.name, this.name])
            } else {
                writes.push(...collection.getWrites())
            }
        }
        return writes
    }

    releaseLocks() {
        for(const [name, collection] of this.collections.entries()) {
            if(collection === null){
                continue
            }
            collection.releaseLocks()
        }
    }

    async createNode(collectionName: string){
        const collection = this.getOrCreateCollection(collectionName)
        return collection.createNode()
    }
}