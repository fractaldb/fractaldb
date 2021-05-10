import net, { Server, Socket } from 'net'
import EventEmitter from 'events'
import ClientConnection from './ClientConnection'
import { DocStore } from './db/DocStore'
import { Transaction } from './db/Transaction'

export class FractalServer extends EventEmitter {
    server: Server
    connections: Set<ClientConnection>
    store: DocStore

    constructor(){
        super()
        
        this.connections = new Set()

        this.server = net.createServer()
        this.store = new DocStore(new Map())
        this.server.on('connection', socket => this.newConnection(socket))
    }

    beginTx(txID: string){
        return new Transaction(this.store, txID)
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
        this.server.listen(24000)
        await promise
    }

    stop () {
        this.server.close()
    }
}