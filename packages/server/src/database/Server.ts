import net, { Server, Socket } from 'net'
import EventEmitter from 'events'
import ClientConnection, { uuidV4 } from './ClientConnection.js'
import Transaction from '../layers/transaction/Transaction.js'
import { ADN, ADNExtension } from '@fractaldb/adn'
import { EntityIDExtension } from '@fractaldb/adn/EntityID.js'
import PersistenceEngine from './PersistenceEngine.js'
import { StorageEngine } from '../layers/disk/storage/StorageEngine.js'
import LockEngine from './LockSystem.js'
import MockLayer from '../layers/mock/MockLayer.js'

interface Config {
    ADNextensions: ADNExtension[]
}

/**
 * Map<string, LockQueue>
 *
 * lockMap.set(`[this.db, this.collection, this.subcollection, id].join('.'), new LockQueue)
 */

export class FractalServer extends EventEmitter {
    server: Server
    connections: Set<ClientConnection>
    adn: ADN
    transactions: Map<string, Transaction>
    lockEngine: LockEngine

    /**
     * Database server layers, excluding transaction
     */
    mockLayer: MockLayer
    // LRU TODO
    // DISK TOOD

    storageEngine: StorageEngine
    persistenceEngine: PersistenceEngine

    constructor(config: Config = { ADNextensions: []}){
        super()

        this.connections = new Set()

        // config.ADNextensions.push(new EntityIDExtension('\x01'))

        this.adn = new ADN(config.ADNextensions)
        this.server = net.createServer()
        this.transactions = new Map()

        this.lockEngine = new LockEngine(this)
        this.mockLayer = new MockLayer(this)
        this.storageEngine = new StorageEngine(this)
        this.persistenceEngine = new PersistenceEngine(this)
        this.server.on('connection', socket => this.newConnection(socket))
    }

    async initialize() {
        await this.storageEngine.initialize()
        await this.persistenceEngine.initialize()
    }

    beginTx(txID: string = uuidV4().toString('hex')){
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
