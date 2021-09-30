import { FractalServer } from '../../database/Server.js'
import LayerInterface from '../../interfaces/LayerInterface.js'
import { Commands, LogCommand } from '../../logcommands/commands.js'
import TransactionDatabase from './TransactionDatabase.js'
export enum TxStatuses {
    ABORTED = 'aborted', // or failed
    COMMITING = 'committing',
    COMMITTED = 'committed',
    ACTIVE = 'active',
    // INACTIVE = 'inactive'
}

export default class Transaction implements LayerInterface {
    id: string // transaction id
    server: FractalServer
    databases: Map<string, TransactionDatabase | null> = new Map()
    waitingOn?: string // resource that this transaction is waiting on
    status: TxStatuses

    constructor(server: FractalServer, txID: string)  {
        this.server = server
        this.id = txID
        this.status = TxStatuses.ACTIVE
    }

    getOrCreateDatabase(name: string): TransactionDatabase {
        let db = this.databases.get(name)
        if (!db) {
            db = new TransactionDatabase(this, { database: name }, this.server.mockLayer.getOrCreateMockDatabase(name))
            this.databases.set(name, db)
        }
        return db
    }

    /**
     * Transaction commit process
     * - if there is writes:
            - find a free log in-memory store to write to
            - get list of write commands that have been applied in the tranaction
            - serialize all of the commands/transaction into a single string
            - generate header with the following data:
                - tx UUID
                - length of serialised data
                - crc32 checksum of serialised data
            - header is a fixed length buffer/encoding of the above data
            - write the serialised string to the transaction log for that in-memory log store
            - apply the write commands to the in-memory log store
            - unlock all resources
            - return success to the client
        - if there is no writes:
            - unlock all resources
            - return success to the client
     */
    async commit(): Promise<void> {
        if(this.status !== TxStatuses.ACTIVE) {
            throw new Error('Transaction is not active')
        }
        this.status = TxStatuses.COMMITING
        let writes: LogCommand[] = []
        for (let [name, db] of this.databases.entries()) {
            if(db === null){
                writes.push([Commands.DeleteDatabase, name])
            } else {
                writes.push(...db.getWrites())
            }
        }

        if (writes.length > 0) {
            let inMemoryLog = await this.server.mockLayer.findFreeLogStore()
            await inMemoryLog.applyTxCommands(writes)
        }

        /** Unlock all resources */
        for (let [name, db] of this.databases.entries()) {
            if(db === null){
                continue
            }
            // db.releaseLocks()
        }
        this.status = TxStatuses.COMMITTED
    }

    async abort(): Promise<void> {

    }
}