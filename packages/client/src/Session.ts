import EventEmitter from 'events'
import { FractalClient, SessionPool } from './Client'
import Cursor from './Cursor'
import Transaction from './Transaction'

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