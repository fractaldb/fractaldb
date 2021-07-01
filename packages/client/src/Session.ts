import EventEmitter from 'events'
import { FractalClient, SessionPool } from './Client.js'
import Cursor from './Cursor.js'
import Transaction from './Transaction.js'

type ClientSessionOptions = {
    owner: Cursor
    client: FractalClient
}

export class ClientSession extends EventEmitter {
    owner: Cursor
    client: FractalClient
    transaction: Transaction

    constructor(client: FractalClient, sessionPool: SessionPool, options: ClientSessionOptions){
        super()

        this.owner = options.owner

        this.client = client

        this.transaction = new Transaction()
    }
}

export {}