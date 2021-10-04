import { FileHandle, open } from 'fs/promises'
import { FractalServer } from '../../database/Server.js'
import { Commands, LogCommand } from '../../logcommands/commands.js'
import AssertUnreachable from '../../utils/AssertUnreachable.js'
import InMemoryLogStoreCollection from './InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from './InMemoryLogStoreDatabase.js'
import InMemoryLogStoreSubcollection from './InMemoryLogStoreSubcollection.js'
import crc32 from 'crc-32'
import LayerInterface from '../../interfaces/LayerInterface.js'
import { LogSetSubcollectionData } from './commands/LogSetSubcollectionData.js'
import { LogSetPowerData } from './commands/LogSetPowerData.js'
import { LogInitialisePower } from './commands/LogInitialisePower.js'
import { LogInitialiseSubcollection } from './commands/LogInitialiseSubcollection.js'
import { LogIncrementPower } from './commands/LogIncrementPower.js'
import { LogIncrementSubcollection } from './commands/LogIncrementSubcollection.js'

export default class InMemoryLogStore implements LayerInterface {
    number: number
    path: string
    fileHandle: FileHandle | null = null

    newer?: InMemoryLogStore
    older?: InMemoryLogStore
    txCount = 0
    maxTxCount = 10
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
        return this.txCount >= this.maxTxCount
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

    private applyTxCommand(command: LogCommand){
        switch (command[0]) {
            case Commands.IncrementSubcollectionHighestID: return LogIncrementSubcollection(this, command)
            case Commands.IncrementPowerHighestID: return LogIncrementPower(this, command)
            case Commands.InitialiseSubcollection: return LogInitialiseSubcollection(this, command)
            case Commands.InitialisePower: return LogInitialisePower(this, command)
            case Commands.SetPowerOfData: return LogSetPowerData(this, command)
            case Commands.SetSubcollectionData: return LogSetSubcollectionData(this, command)
        }

        // return AssertUnreachable(command[0])
    }

}