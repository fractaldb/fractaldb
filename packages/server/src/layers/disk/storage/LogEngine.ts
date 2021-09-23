import { existsSync, readFileSync } from 'fs'
import { resolve as ResolvePath } from 'path'
import InMemoryLogStore from '../../inMemoryLogStore/InMemoryLogStore.js'
import { StorageEngine } from './StorageEngine.js'
import crc32 from 'crc-32'
import { LogCommand } from '../../../logcommands/index.js'
import MockLayer from '../../mock/MockLayer.js'

enum SIDES {
    LEFT = 0,
    RIGHT = 1
}

export default class LogEngine {
    storageEngine: StorageEngine
    mockLayer: MockLayer

    private highestPersistedIDSide: SIDES = SIDES.LEFT

    constructor(storageEngine: StorageEngine){
        this.storageEngine = storageEngine
        this.mockLayer = this.storageEngine.server.mockLayer
    }

    async initialize(){
        await this.setupLogs()
    }

    get server() {
        return this.storageEngine.server
    }

    get logsPath(){
        return this.storageEngine.logsPath
    }

    getLogPath(logNumber: number){
        return ResolvePath(this.logsPath, `${logNumber}.log.fdb`)
    }

    async deserialiseLog(id: number, data: Buffer){
        let offset = 0
        let txs: LogCommand[][] = []
        while(offset < data.length){
            let length = data.readInt32BE(offset)
            offset += 4
            let checksum = data.readInt32BE(offset)
            offset += 4
            let adn = data.slice(offset, offset + length)
            offset += length

            if(crc32.buf(adn) === checksum){
                let deserialised = this.server.adn.deserialize(adn.toString()) as LogCommand[]
                txs.push(deserialised)
            } else {
                throw new Error(`Checksum mismatch for log ${id}`)
            }
        }
        return txs
    }

    /**
     * Log file names start from 1 and go to infinity
     * If the log file number is 0 then it means that no log files should exist, so we create them
     * If the log file is greater than 0, then we load the left and right number, and compare them them
     */
    async setupLogs() {
        let handler = this.storageEngine.configFileHandler
        let bufferlength = 4 * 4 // 4 x 32-bit integers, two for each side
        let fileBuffer = Buffer.alloc(bufferlength)
        await handler.read(fileBuffer, 0, bufferlength)

        let left0 = fileBuffer.readInt32BE(0)
        let left1 = fileBuffer.readInt32BE(4)
        let right0 = fileBuffer.readInt32BE(8)
        let right1 = fileBuffer.readInt32BE(12)

        let leftValid = left0 === left1
        let rightValid = right0 === right1

        if(!leftValid && !rightValid){
            throw new Error('Last persisted log number corruption has occured')
        }

        let left = leftValid ? left1 : 0
        let right = rightValid ? right1 : 0

        let highestPersistedNumber = left > right ? left : right

        let nextLogNumber = highestPersistedNumber + 1
        let newestLog: InMemoryLogStore | undefined
        let oldestLog: InMemoryLogStore | undefined
        /**
         * This will try to find any log files with numbers larger than the highestValidPersistedNumber
         * that exist in the logs directory
         *
         * For each log file found, we will:
         * - Instantiate a inMemoryLogStore for it
         * - Deserialise each transaction in the log and put it into the inMemoryLogStore,
         *   incrementing the txCount by one
         * - Link the inMemoryLogStore to any older and newer log inMemoryLogStore
         */

        while(true) {
            // Check if the next log file exists
            let nextLogFile = ResolvePath(this.logsPath, `${nextLogNumber}.log.fdb`)
            let fileExists = existsSync(nextLogFile)
            if (!fileExists) break

            // instantiate a inMemoryLogStore for the next log file
            let currentLogStore = new InMemoryLogStore(this.server, nextLogNumber)
            let buffer = readFileSync(nextLogFile)
            let txs = await this.deserialiseLog(nextLogNumber, buffer)

            for (let tx of txs) {
                currentLogStore.applyTxCommands(tx)
                currentLogStore.txCount++
            }
            if(!oldestLog){
                oldestLog = currentLogStore
            }
            if(newestLog){
                currentLogStore.older = newestLog
                newestLog.newer = currentLogStore
            }
            newestLog = currentLogStore
            nextLogNumber++
        }

        if(!oldestLog){
            oldestLog = new InMemoryLogStore(this.server, 1)
        }
        if(!newestLog){
            newestLog = oldestLog
        }

        if(newestLog.isFull){
            let newLog = new InMemoryLogStore(this.server, newestLog.number + 1)
            newLog.older = newestLog
            newestLog.newer = newLog
            newestLog = newLog
        }

        this.server.mockLayer.mostRecentLogStore = newestLog as InMemoryLogStore
        this.server.persistenceEngine.leastRecentLogStore = oldestLog as InMemoryLogStore
        this.highestPersistedIDSide = left > right ? SIDES.LEFT : SIDES.RIGHT
    }
}