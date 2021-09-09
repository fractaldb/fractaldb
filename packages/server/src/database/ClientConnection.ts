import { Socket } from 'net'
import EventEmitter from 'events'
import { OperationResponse, RequestOperation } from '@fractaldb/shared/operations/index.js'
import { FractalServer } from './Server.js'
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

import { AbortTransactionCommand } from '../commands/AbortTransaction.js'
import { UpdateOneCommand } from '../commands/UpdateOne.js'
import { FindOneCommand } from '../commands/FindOne.js'
import { CountCommand } from '../commands/Count.js'
import { DeleteManyCommand } from '../commands/DeleteMany.js'
import { DeleteOneCommand } from '../commands/DeleteOne.js'
import { FindManyCommand } from '../commands/FindMany.js'
import { InsertManyCommand } from '../commands/InsertMany.js'
import { InsertOneCommand } from '../commands/InsertOne.js'
import { StartTransactionCommand } from '../commands/StartTransaction.js'
import { UpdateManyCommand } from '../commands/UpdateMany.js'
import { CommitTransactionCommand } from '../commands/CommitTransaction.js'
import { splitBufferStream, DataTypes } from '@fractaldb/shared/utils/buffer.js'

export default class ClientConnection extends EventEmitter {
    socket: Socket
    server: FractalServer

    constructor(socket: Socket, server: FractalServer){
        super()
        this.socket = socket
        this.server = server

        let bufferStream = splitBufferStream(str => this.handleMessage(str))

        socket.on('data', data => bufferStream(data))
    }

    sendMessage(json: { requestID: string, response: OperationResponse}){
        let serializedMessage = this.server.adn.serialize(json).replace(/\x00|\x01/g, (str: string) => DataTypes.ESCAPECHAR + str)
        this.socket.write(Buffer.concat([Buffer.from(serializedMessage), Buffer.alloc(1, 0x00)]))
    }

    async handleMessage(data: string){
        let operation = this.server.adn.deserialize(data) as RequestOperation

        let response: OperationResponse
        let shouldCommit = !operation.txID // don't commit if client is managing it's own txID

        let txID = operation.txID ?? uuidV4().toString()

        // get the transaction by it's ID if set, otherwise create a new transaction
        let tx = this.server.beginTx(txID)

        switch (operation.op) {
            case 'AbortTransaction':
                response = await AbortTransactionCommand(operation, tx)
                break
            case 'StartTransaction':
                response = await StartTransactionCommand(operation, tx)
                shouldCommit = false
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
            case 'UpdateMany':
                response = await UpdateManyCommand(operation, tx)
                break
            case 'UpdateOne':
                response = await UpdateOneCommand(operation, tx)
                break
        }

        if(shouldCommit) await tx.commit()

        this.sendMessage({ requestID: operation.requestID, response })
    }
}