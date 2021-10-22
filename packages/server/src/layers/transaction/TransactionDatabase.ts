import DatabaseInterface from '../../interfaces/DatabaseInterface.js'
import { DatabaseOpts } from '../../interfaces/Options.js'
import { Commands, LogCommand } from '../../logcommands/commands.js'
import MockDatabase from '../mock/MockDatabase.js'
import Transaction from './Transaction.js'
import TransactionCollection from './TransactionCollection.js'
export default class TransactionDatabase implements DatabaseInterface {
    tx: Transaction
    opts: DatabaseOpts
    collections: Map<string, TransactionCollection | null> = new Map()
    mock: MockDatabase

    constructor(tx: Transaction, opts: DatabaseOpts, mock: MockDatabase) {
        this.opts = opts
        this.tx = tx
        this.mock = mock
    }

    getOrCreateCollection(name: string): TransactionCollection {
        let collection = this.collections.get(name)
        if(!collection) {
            collection = new TransactionCollection(this.tx, {...this.opts, collection: name}, this.mock.getOrCreateMockCollection(name))
            this.collections.set(name, collection)
        }
        return collection
    }

    async getWrites(): Promise<LogCommand[]> {
        let writes: LogCommand[] = []
        for(const [name, collection] of this.collections.entries()) {
            if(collection === null){
                writes.push([Commands.DeleteCollection, this.opts.database, name])
            } else {
                writes.push(...await collection.getWrites())
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

    releaseUsedIDs() {
        for(const [name, collection] of this.collections.entries()) {
            if(collection === null){
                continue
            }
            collection.releaseUsedIDs()
        }
    }
}