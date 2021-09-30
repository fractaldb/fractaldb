import { access, FileHandle, mkdir, open, write } from 'fs/promises'
import { resolve as ResolvePath } from 'path'
import { homedir } from 'os'
import LogEngine from './LogEngine.js'
import { FractalServer } from '../../../index.js'


const homedirPath = homedir()

async function exists(path: string) {
    try {
        await access(path)
        return true
    } catch (e) {
        return false
    }
}
/**
 * storage engine for fractaldb
 * sets up data files for each collection
 */
export class StorageEngine {

    readonly fractalPath: string
    readonly dataPath: string
    readonly logsPath: string
    readonly configPath: string

    server: FractalServer
    logEngine: LogEngine
    configFileHandler!: FileHandle

    constructor(server: FractalServer) {
        this.fractalPath = `${homedirPath}/fractaldb/`
        this.dataPath = ResolvePath(this.fractalPath, `data/`)
        this.logsPath = ResolvePath(this.fractalPath, `logs/`)
        this.configPath = ResolvePath(this.fractalPath, `config.fdb`)

        this.server = server

        this.logEngine = new LogEngine(this)
    }

    async initialize() {
        // create fractaldb folder if it doesn't exist
        if (!await exists(this.fractalPath)) {
            await mkdir(this.fractalPath)
        }
        if (!await exists(this.dataPath)) {
            await mkdir(this.dataPath)
        }
        if (!await exists(this.logsPath)) {
            await mkdir(this.logsPath)
        }
        /**
         * Get database config file
         */
        if (!this.configFileHandler) {
            this.configFileHandler = await open(this.configPath, 'w+')
        }

        await this.logEngine.initialize()
    }
}

