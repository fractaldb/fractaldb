import { FractalServer } from '../../database/Server.js'
import { Commands, LogCommand } from '../../logcommands/index.js'
import TransactionDatabase from './TransactionDatabase.js'
import crc32 from 'crc-32'

export enum TxStatuses {
    ABORTED = 'aborted', // or failed
    COMMITING = 'committing',
    COMMITTED = 'committed',
    ACTIVE = 'active',
    // INACTIVE = 'inactive'
}

export type WaitingOn = [database: string, collection: string, subcollection: string, resource: number]

export default class Transaction {
    id: string // transaction id
    server: FractalServer
    databases: Map<string, TransactionDatabase | null> = new Map()
    waitingOn?: WaitingOn
    status: TxStatuses


    constructor(server: FractalServer, txID: string)  {
        this.server = server
        this.id = txID
        this.status = TxStatuses.ACTIVE
    }

    getOrCreateDatabase(name: string): TransactionDatabase {
        let db = this.databases.get(name)
        if (!db) {
            db = new TransactionDatabase(this, this.server.getOrCreateDatabaseManager(name), name)
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
            let adn = this.server.adn
            let serialized = Buffer.from(adn.serialize(writes))
            let length = Buffer.alloc(4)
            length.writeInt32BE(serialized.length)
            let checksum = Buffer.alloc(4)
            checksum.writeInt32BE(crc32.buf(serialized))
            let logEntry = Buffer.concat([length, checksum, serialized])
            let inMemoryLog = await this.server.inMemoryLayer.findFreeLogStore()
            await inMemoryLog.write(logEntry)
            inMemoryLog.applyTxCommands(writes)
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