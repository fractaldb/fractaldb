import Database from './Database'
import Cursor from './Cursor'
import FindOperation, { FindCommand } from './operations/FindOperation'
import { FractalNamespace, uuidV4 } from './utils'
import { UpdateOperation } from '@fractaldb/shared/utils/JSONPatch'
import { Operation, OperationResponse } from '@fractaldb/shared/operations'
import JSONObject from '@fractaldb/shared/utils/JSONObject'

export default class Collection {
    name: string
    database: Database
    namespace: FractalNamespace

    constructor(name: string, database: Database){
        this.name = name
        this.database = database
        this.namespace = new FractalNamespace(database, this)
    }

    get socket () {
        return this.database.client.socket
    }

    sendMessage(json: Operation){
        let requestID = uuidV4().toString('hex')

        let responsePromise = new Promise(resolve => this.database.client.on(`response:${requestID}`, resolve))

        this.socket.write(Buffer.concat([Buffer.from(JSON.stringify({...json, requestID})), Buffer.alloc(1, 0x00)]))

        return responsePromise
    }


    find(query: any, options: FindCommand = {}) {
        let command = {
            query,
            limit: options.limit ?? 0,
            skip: options.skip ?? 0,
            sort: options.sort ?? 1
        }

        // let cursor = this.database.client.cursor(new FindOperation(this.namespace, command, {}))

        // return cursor
    }

    async findOne(query: any = {}) {
        return await this.sendMessage({
            op: 'FindOne',
            query,
            projection: {}
        })
    }

    async updateMany(query: any = {}, updateOps: UpdateOperation[]){
        return this.sendMessage({
            op: 'UpdateMany',
            query,
            updateOps
        })
    }

    async updateOne(query: any = {}, updateOps: UpdateOperation[]){
        return await this.sendMessage({
            op: 'UpdateOne',
            query,
            updateOps
        })
    }

    async insertOne(doc: JSONObject){
        return await this.sendMessage({
            op: 'InsertOne',
            doc
        })
    }

}