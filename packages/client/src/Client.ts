import net, { Socket } from 'net'
import EventEmitter from 'events'
import { Operation } from '@fractaldb/shared/operations'
import { splitBufferStream } from '@fractaldb/shared/utils/splitStream'
import Collection from './Collection'
import Cursor from './Cursor'
import Database from './Database'
import { ClientSession } from './Session'

type FractalClientOptions = {
    host: string
    port: number
}

export class FractalClient extends EventEmitter {
    socket: Socket
    state: FractalClientState = new FractalClientState()

    constructor({ port, host }: FractalClientOptions = { port: 24000, host: 'localhost'}){
        super()

        this.socket = net.createConnection({ port, host })
        this.socket.setNoDelay(false)

        let bufferStream = splitBufferStream(str => {
            let obj = JSON.parse(str)
            let requestID = obj.requestID
            this.emit(`response:${requestID}`, obj.response)
        })

        this.socket.on('data', bufferStream)
    }

    startSession(){
        // let session = new ClientSession(this, this.state.sessionPool, {})

        // session.once('ended', () => {
        //     this.state.sessions.delete(session)
        // })

        // this.state
    }

    db(name: string){
        return new Database(name, this)
    }

    cursor(operation: Operation){
        // return new Cursor(this, operation)
    }
}


class FractalClientState {
    sessionPool: SessionPool = new SessionPool()
    sessions: Map<string, ClientSession> = new Map()
}

export class SessionPool {
    
}