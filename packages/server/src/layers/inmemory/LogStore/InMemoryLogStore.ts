import { FileHandle, open } from 'fs/promises'
import { FractalServer } from '../../../database/Server.js'
import { Commands, LogCommand } from '../../../logcommands/index.js'
import AssertUnreachable from '../../../utils/AssertUnreachable.js'
import InMemoryLogStoreCollection from './InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from './InMemoryLogStoreDatabase.js'
import InMemoryLogStoreSubcollection from './InMemoryLogStoreSubcollection.js'

export default class InMemoryLogStore {
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

    /**
     * Gets the database for the given name.
     * If the value is null, then it means the database has been deleted, so return null
     * If the value is undefined, then it means the database does not exist in this layer, but it may exist in a lower layer
     */
    getDatabase(name: string): InMemoryLogStoreDatabase | null {
        const database = this.databases.get(name)
        if (database === undefined) {
            if (this.older) {
                return this.older.getDatabase(name)
            } else {
                throw new Error('Lower layer not implemented')
            }
        } else if (database === null) {
            return null
        } else {
            return database
        }
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

    applyTxCommands(commands: LogCommand[]){
        for (const command of commands) {
            this.applyTxCommand(command)
        }
    }

    applyTxCommand(command: LogCommand) {
        switch (command[0]) {
            case Commands.CreateCollection: {
                let dbname = command[1]
                let collectionname = command[2]
                let db = this.databases.get(dbname)
                let dbManager = this.server.getOrCreateDatabaseManager(dbname)

                if (!db) {
                    db = new InMemoryLogStoreDatabase(this, dbname)
                    this.databases.set(dbname, db)
                }
                let collection = db.collections.get(collectionname)
                if (!collection) {
                    collection = new InMemoryLogStoreCollection(dbManager, this, dbname, collectionname)
                    db.collections.set(collectionname, collection)
                }
                return
            }
            case Commands.CreateDatabase: {
                let dbname = command[1]
                let db = this.databases.get(dbname)
                if (!db) {
                    db = new InMemoryLogStoreDatabase(this, dbname)
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
                let dbManager = this.server.getOrCreateDatabaseManager(dbname)

                if(!db) {
                    db = new InMemoryLogStoreDatabase(this, dbname)
                    this.databases.set(dbname, db)
                }
                let collection = db.collections.get(collectionname)
                if (!collection) {
                    collection = new InMemoryLogStoreCollection(dbManager, this, dbname, collectionname)
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