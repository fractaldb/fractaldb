import net, { Socket } from 'net'
import EventEmitter from 'events'
import { Operation } from '@fractaldb/shared/operations/index.js'
import { splitBufferStream } from '@fractaldb/shared/utils/buffer.js'
import Database from './Database.js'
import { ADN, ADNExtension } from '@fractaldb/adn'
import { EntityIDExtension } from '@fractaldb/adn/EntityID.js'

type FractalClientOptions = {
    host: string
    port: number
    ADNExtensions: ADNExtension[]
}

export class FractalClient extends EventEmitter {
    socket: Socket
    adn: ADN

    constructor({ port, host, ADNExtensions }: FractalClientOptions = { port: 24000, host: 'localhost', ADNExtensions: []}){
        super()

        // ADNExtensions.push(new EntityIDExtension('\x01'))
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