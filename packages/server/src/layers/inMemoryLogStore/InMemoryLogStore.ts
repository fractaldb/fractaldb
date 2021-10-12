import { FileHandle, open } from 'fs/promises'
import { FractalServer } from '../../database/Server.js'
import { Commands, LogCommand } from '../../logcommands/commands.js'
import InMemoryLogStoreDatabase from './InMemoryLogStoreDatabase.js'
import crc32 from 'crc-32'
import LayerInterface from '../../interfaces/LayerInterface.js'
import { LogSetSubcollectionData } from './commands/LogSetSubcollectionData.js'
import { LogSetPowerData } from './commands/LogSetPowerData.js'
import { LogIncrementPower } from './commands/LogIncrementPower.js'
import { LogIncrementSubcollection } from './commands/LogIncrementSubcollection.js'
import { LogStatuses } from '../../database/PersistenceEngine.js'
import { RemoveRootIndexCommand } from './commands/LogRemoveRootIndex.js'
import { AddRootIndexCommand } from './commands/LogAddRootIndex.js'
import { LogDeleteDatabase } from './commands/LogDeleteDatabase.js'
import { LogDeleteCollection } from './commands/LogDeleteCollection.js'

export default class InMemoryLogStore implements LayerInterface {
    number: number
    path: string
    fileHandle: FileHandle | null = null
    handlePromise: Promise<FileHandle> | null = null
    status: LogStatuses

    newer?: InMemoryLogStore
    older?: InMemoryLogStore
    txCount = 0
    maxTxCount = 250
    server: FractalServer
    databases: Map<string, InMemoryLogStoreDatabase | null> = new Map()

    constructor(server: FractalServer, number: number) {
        this.server = server
        this.number = number
        this.path = this.server.storageEngine.logEngine.getLogPath(number)
        this.status = LogStatuses.UNPERSISTED
    }

    async getHandle(){
        if(this.handlePromise) await this.handlePromise
        if(this.fileHandle) return this.fileHandle
        this.handlePromise = open(this.path, 'a+')
        this.fileHandle = await this.handlePromise
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
        return this.txCount >= this.maxTxCount
    }

    async writeCommands(commands: LogCommand[]){
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

        // apply commands to in-memory log store
        this.applyTxCommands(commands)
    }

    applyTxCommands(commands: LogCommand[]){
        for(const command of commands){
            this.applyTxCommand(command)
        }
    }

    private applyTxCommand(command: LogCommand){
        switch (command[0]) {
            case Commands.AddRootIndex: return AddRootIndexCommand(this, command)
            case Commands.RemoveRootIndex: return RemoveRootIndexCommand(this, command)
            case Commands.IncrementSubcollectionHighestID: return LogIncrementSubcollection(this, command)
            case Commands.IncrementPowerHighestID: return LogIncrementPower(this, command)
            case Commands.SetPowerOfData: return LogSetPowerData(this, command)
            case Commands.SetSubcollectionData: return LogSetSubcollectionData(this, command)
            case Commands.DeleteDatabase: return LogDeleteDatabase(this, command)
            case Commands.DeleteCollection: return LogDeleteCollection(this, command)
        }
    }

}