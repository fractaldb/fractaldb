import { Socket } from 'net'
import EventEmitter from 'events'
import { OperationResponse, RequestOperation } from '@fractaldb/shared/operations'
import { FractalServer } from './Server'
import Session from './Session'
import { randomBytes } from 'crypto'

/**
 * Generate a UUIDv4
 */
 export const uuidV4 = () => {
    const result = randomBytes(16)
    result[6] = (result[6] & 0x0f) | 0x40
    result[8] = (result[8] & 0x3f) | 0x80
    return result
}

import { AbortTransactionCommand } from './commands/AbortTransaction'
import { UpdateOneCommand } from './commands/UpdateOne'
import { FindOneCommand } from './commands/FindOne'
import { CountCommand } from './commands/Count'
import { DeleteManyCommand } from './commands/DeleteMany'
import { DeleteOneCommand } from './commands/DeleteOne'
import { FindManyCommand } from './commands/FindMany'
import { InsertManyCommand } from './commands/InsertMany'
import { InsertOneCommand } from './commands/InsertOne'
import { StartTransactionCommand } from './commands/StartTransaction'
import { UpdateManyCommand } from './commands/UpdateMany'
import { CommitTransactionCommand } from './commands/CommitTransaction'
import { splitBufferStream } from '@fractaldb/shared/utils/splitStream'

export default class ClientConnection extends EventEmitter {
    socket: Socket
    server: FractalServer
    sessions: Map<Buffer, Session>

    constructor(socket: Socket, server: FractalServer){
        super()
        this.socket = socket
        this.server = server
        this.sessions = new Map()

        let bufferStream = splitBufferStream(str => this.handleMessage(str))

        socket.on('data', data => bufferStream(data))
    }

    sendMessage(json: { requestID: string, response: OperationResponse}){
        this.socket.write(Buffer.concat([Buffer.from(JSON.stringify(json)), Buffer.alloc(1, 0x00)]))
    }

    async handleMessage(data: string){
        let operation = JSON.parse(data) as RequestOperation
        let response: OperationResponse
        let commit = !operation.txID // don't commit if client is managing it's own txID

        let txID = operation.txID ?? uuidV4().toString()

        // get the transaction by it's ID if set, otherwise create a new transaction
        let tx = this.server.beginTx(txID)

        switch (operation.op) {
            case 'AbortTransaction':
                response = await AbortTransactionCommand(operation, tx)
                break
            case 'CommitTransaction':
                response = await CommitTransactionCommand(operation, tx)
                break
            case 'Count':
                response = await CountCommand(operation, tx)
                break
            case 'DeleteMany':
                response = await DeleteManyCommand(operation, tx)
                break
            case 'DeleteOne':
                response = await DeleteOneCommand(operation, tx)
                break
            case 'FindMany':
                response = await FindManyCommand(operation, tx)
                break
            case 'FindOne':
                response = await FindOneCommand(operation, tx)
                break
            case 'InsertMany':
                response = await InsertManyCommand(operation, tx)
                break
            case 'InsertOne':
                response = await InsertOneCommand(operation, tx)
                break
            case 'StartTransaction':
                response = await StartTransactionCommand(operation, tx)
                commit = false
                break
            case 'UpdateMany':
                response = await UpdateManyCommand(operation, tx)
                break
            case 'UpdateOne':
                response = await UpdateOneCommand(operation, tx)
                break
        }

        if(commit) await tx.commit()
        
        this.sendMessage({ requestID: operation.requestID, response })
    }
}