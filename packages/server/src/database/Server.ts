import net, { Server, Socket } from 'net'
import EventEmitter from 'events'
import ClientConnection from './ClientConnection.js'
import Transaction from '../layers/transaction/Transaction.js'
import { ADN, ADNExtension } from '@fractaldb/adn'
import { EntityIDExtension } from '@fractaldb/adn/EntityID.js'
import DatabaseManager from '../managers/DatabaseManager.js'
import InMemoryLayer from '../layers/inmemory/InMemoryLayer.js'
import PersistenceEngine from './PersistenceEngine.js'
import InMemoryLogStore from '../layers/inmemory/LogStore/InMemoryLogStore.js'
import { StorageEngine } from '../layers/disk/storage/StorageEngine.js'

interface Config {
    ADNextensions: ADNExtension[]
}

export class FractalServer extends EventEmitter {
    server: Server
    connections: Set<ClientConnection>
    databaseManagers: Map<string, DatabaseManager>
    adn: ADN
    transactions: Map<string, Transaction>

    /**
     * Database server layers, excluding transaction
     */
    inMemoryLayer: InMemoryLayer
    // LRU TODO
    // DISK TOOD

    storageEngine: StorageEngine
    persistenceEngine: PersistenceEngine

    constructor(config: Config = { ADNextensions: []}){
        super()

        this.connections = new Set()

        config.ADNextensions.push(new EntityIDExtension('\x01'))

        this.adn = new ADN(config.ADNextensions)
        this.server = net.createServer()
        this.transactions = new Map()
        this.databaseManagers = new Map()

        this.inMemoryLayer = new InMemoryLayer(this)
        this.storageEngine = new StorageEngine(this)
        this.persistenceEngine = new PersistenceEngine(this)
        this.server.on('connection', socket => this.newConnection(socket))
    }

    async initialize() {
        await this.storageEngine.initialize()
        await this.persistenceEngine.initialize()
    }

    getOrCreateDatabaseManager(name: string){
        let manager = this.databaseManagers.get(name)
        if(!manager){
            manager = new DatabaseManager(this, name)
            this.databaseManagers.set(name, manager)
        }
        return manager
    }

    beginTx(txID: string){
        const tx = new Transaction(this, txID)
        this.transactions.set(txID, tx)
        return tx
    }

    newConnection(socket: Socket){
        socket.setNoDelay(false)
        const connection = new ClientConnection(socket, this)
        this.connections.add(connection)

        socket.on('end', () => {
            this.connections.delete(connection)
        })
    }

    async start() {
        if(this.server.listening) throw new Error('FractalServer has already been started')
        let promise = new Promise(resolve => this.server.on('listening', resolve))
        await this.initialize()
        this.server.listen(24000)
        await promise
    }

    async stop () {
        this.server.close()
    }
}
