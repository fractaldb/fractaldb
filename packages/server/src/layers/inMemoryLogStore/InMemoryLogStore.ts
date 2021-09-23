import { FileHandle, open } from 'fs/promises'
import { FractalServer } from '../../database/Server.js'
import { Commands, LogCommand } from '../../logcommands/index.js'
import AssertUnreachable from '../../utils/AssertUnreachable.js'
import InMemoryLogStoreCollection from './InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from './InMemoryLogStoreDatabase.js'
import InMemoryLogStoreSubcollection from './InMemoryLogStoreSubcollection.js'
import crc32 from 'crc-32'
import LayerInterface from '../../interfaces/LayerInterface.js'

export default class InMemoryLogStore implements LayerInterface {
    number: number
    path: string
    fileHandle: FileHandle | null = null

    newer?: InMemoryLogStore
    older?: InMemoryLogStore
    txCount = 0
    maxTxCount = 2
    server: FractalServer
    databases: Map<string, InMemoryLogStoreDatabase | null> = new Map()

    constructor(server: FractalServer, number: number) {
        this.server = server
        this.number = number
        this.path = this.server.storageEngine.logEngine.getLogPath(number)
    }

    async getHandle(){
        if(this.fileHandle) return this.fileHandle
        this.fileHandle = await open(this.path, 'a+')
        return this.fileHandle
    }

    async close() {
        if(this.fileHandle) await this.fileHandle.close()
        this.fileHandle = null
    }

    async write(buffer: Buffer) {
        let fileHandle = await this.getHandle()
        await fileHandle.appendFile(buffer)
    }

    set isFull (value: boolean) {
        this.txCount = value ? this.maxTxCount : this.txCount
    }
    get isFull () {
        return this.txCount === this.maxTxCount
    }

    async applyTxCommands(commands: LogCommand[]){
        let adn = this.server.adn
        let serialized = Buffer.from(adn.serialize(commands))
        let length = Buffer.alloc(4)
        length.writeInt32BE(serialized.length)
        let checksum = Buffer.alloc(4)
        checksum.writeInt32BE(crc32.buf(serialized))

        // buffer that will be written to log file on disk
        let logEntry = Buffer.concat([length, checksum, serialized])

        // write log entry before applying commands to ensure integrity
        await this.write(logEntry)

        for (const command of commands) {
            // apply each command to the log store
            this.applyTxCommand(command)
        }
    }

    private applyTxCommand(command: LogCommand) {
        switch (command[0]) {
            case Commands.CreateCollection: {
                let dbname = command[1]
                let collectionname = command[2]
                let db = this.databases.get(dbname)

                if (!db) {
                    db = new InMemoryLogStoreDatabase(this, { database: dbname })
                    this.databases.set(dbname, db)
                }
                let collection = db.collections.get(collectionname)
                if (!collection) {
                    collection = new InMemoryLogStoreCollection(this, {database: dbname, collection: collectionname})
                    db.collections.set(collectionname, collection)
                }
                return
            }
            case Commands.CreateDatabase: {
                let dbname = command[1]
                let db = this.databases.get(dbname)
                if (!db) {
                    db = new InMemoryLogStoreDatabase(this, { database: dbname })
                    this.databases.set(dbname, db)
                }
                return
            }
            case Commands.DeleteCollection: {
                let dbname = command[1]
                let collectionname = command[2]
                let db = this.databases.get(dbname)
                if (db) db.collections.set(collectionname, null)
                return
            }
            case Commands.DeleteDatabase: {
                let dbname = command[1]
                return this.databases.set(dbname, null)
            }
            case Commands.CreatePowerOfCollection: {
                let dbname = command[1]
                let collectionname = command[2]
                let db = this.databases.get(dbname)

                if(!db) {
                    db = new InMemoryLogStoreDatabase(this, { database: dbname })
                    this.databases.set(dbname, db)
                }
                let collection = db.collections.get(collectionname)
                if (!collection) {
                    collection = new InMemoryLogStoreCollection(this, { database: dbname, collection: collectionname })
                    db.collections.set(collectionname, collection)
                }
                let powerOfCollection = (collection as any)[command[3]].get(command[4]) as InMemoryLogStoreSubcollection<any>
                if (!powerOfCollection) {

                }
                return
            }
        }

        return

        // return AssertUnreachable(command[0])
    }

}