import Database from './Database.js'
import Cursor from './Cursor.js'
import FindOperation, { FindCommand } from './operations/FindOperation.js'
import { FractalNamespace, uuidV4 } from './utils.js'
import { UpdateOperation } from '@fractaldb/shared/utils/JSONPatch.js'
import { Operation, OperationResponse } from '@fractaldb/shared/operations/index.js'
import { Entity } from '@fractaldb/shared/utils/Entity.js'
import { FindOneResponse } from '@fractaldb/shared/operations/FindOne.js'
import { CreateNodeResponse } from '@fractaldb/shared/operations/CreateNode.js'
import { DataTypes } from '@fractaldb/adn/Types.js'
import { IndexTypes, IndexOperation } from '@fractaldb/shared/structs/DataTypes.js'
import { IndexGetResponse } from '@fractaldb/shared/operations/IndexGet.js'

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

    sendMessage(json: Operation): Promise<any>{
        let requestID = uuidV4().toString('hex')

        let responsePromise = new Promise(resolve => this.database.client.once(`response:${requestID}`, resolve))
        let msg = this.database.client.adn.serialize({...json, requestID}).replace(/\x00|\x0b/g, str => DataTypes.ESCAPECHAR + str)
        this.socket.write(Buffer.concat([Buffer.from(msg), Buffer.alloc(1, 0x00)]))

        return responsePromise
    }

    async createNode(){
        let data = {
            database: this.database.name,
            collection: this.name
        }
        let response = await this.sendMessage({
            op: 'CreateNode',
            ...data
        }) as CreateNodeResponse

        return {...response, ...data}
    }

    async ensureRootIndex(type: 'unique' | 'property', path: (string|number)[], background: boolean = true){
        return await this.sendMessage({
            op: 'EnsureRootIndex',
            database: this.database.name,
            collection: this.name,
            type: IndexTypes[type],
            path,
            background
        })
    }

    async findMany(query: Object) {
        return await this.sendMessage({
            op: 'FindMany',
            limit: 10,
            collection: this.name,
            database: this.database.name,
            query,
            closeCursor: true,
            batchSize: 10
        })
    }

    async findOne(query: Object) {
        return await this.sendMessage({
            op: 'FindOne',
            collection: this.name,
            database: this.database.name,
            query
        })
    }

    async indexGet(index: number, key: string): Promise<IndexGetResponse> {
        return await this.sendMessage({
            op: 'IndexGet',
            database: this.database.name,
            collection: this.name,
            index,
            key
        })
    }

    async indexSet(index: number, key: string, data: IndexOperation){
        return await this.sendMessage({
            op: 'IndexSet',
            database: this.database.name,
            collection: this.name,
            index,
            key,
            data
        })
    }

    /**
     * This will delete the node from the database
     * It will also delete:
     *  - any of it's property / children
     *  - edges
     */
    async deleteNode(node: number): Promise<void> {
        await this.sendMessage({
            op: 'DeleteNode',
            database: this.database.name,
            collection: this.name,
            node
        })

        return
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

    // async findOne(query: any = {}): Promise<FindOneResponse> {
    //     return await this.sendMessage({
    //         op: 'FindOne',
    //         query,
    //         projection: {}
    //     })
    // }

    // async updateMany(query: any = {}, updateOps: UpdateOperation[]){
    //     return this.sendMessage({
    //         op: 'UpdateMany',
    //         query,
    //         updateOps
    //     })
    // }

    // async updateOne(query: any = {}, updateOps: UpdateOperation[]){
    //     return await this.sendMessage({
    //         op: 'UpdateOne',
    //         query,
    //         updateOps
    //     })
    // }

    // async insertOne(doc: Entity){
    //     return await this.sendMessage({
    //         op: 'InsertOne',
    //         doc
    //     })
    // }

}