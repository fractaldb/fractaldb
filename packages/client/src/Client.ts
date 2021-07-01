import net, { Socket } from 'net'
import EventEmitter from 'events'
import { Operation } from '@fractaldb/shared/operations'
import { splitBufferStream } from '@fractaldb/shared/utils/buffer'
import Database from './Database'
import { ClientSession } from './Session'
import { ADN, ADNExtension } from '@fractaldb/adn'
import { EntityIDExtension } from '@fractaldb/adn/EntityID.js'

type FractalClientOptions = {
    host: string
    port: number
    ADNExtensions: ADNExtension[]
}

export class FractalClient extends EventEmitter {
    socket: Socket
    state: FractalClientState = new FractalClientState()
    adn: ADN

    constructor({ port, host, ADNExtensions }: FractalClientOptions = { port: 24000, host: 'localhost', ADNExtensions: []}){
        super()

        ADNExtensions.push(new EntityIDExtension('\x01'))
        this.adn = new ADN(ADNExtensions)
        this.socket = net.createConnection({ port, host })
        this.socket.setNoDelay(false)

        let bufferStream = splitBufferStream(str => {
            let obj = this.adn.deserialize(str)
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

    close() {
        this.socket.destroy()
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