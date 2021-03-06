import { DocStore, Entity, EntityMap } from './DocStore'
import { apply, UpdateOperation } from '@fractaldb/shared/src/utils/JSONPatch'
import { InsertManyResponse } from '@fractaldb/shared/src/operations/InsertMany'
import { InsertOneResponse } from '@fractaldb/shared/src/operations/InsertOne'
import { FindOneResponse } from '@fractaldb/shared/src/operations/FindOne'
import { FindManyResponse } from '@fractaldb/shared/src/operations/FindMany'
import { UpdateOneResponse } from '@fractaldb/shared/src/operations/UpdateOne'
import { UpdateManyResponse } from '@fractaldb/shared/src/operations/UpdateMany'
import { DeleteOneResponse } from '@fractaldb/shared/src/operations/DeleteOne'
import { DeleteManyResponse } from '@fractaldb/shared/src/operations/DeleteMany'
import { CountResponse } from '@fractaldb/shared/src/operations/Count'
import JSONObject from '@fractaldb/shared/src/utils/JSONObject'
import ObjectID from 'bson-objectid'

interface queryOption {
    projection: any
    sort: any
}

interface TransactionInterface {  

    id: string //tx ID

    findOne(query: any, options?: queryOption): Entity | null
    findMany(query: any, options?: queryOption): Entity[]
    
    insertOne(doc: any, options?: queryOption): InsertOneResponse
    insertMany(doc: any[], options?: queryOption): InsertManyResponse

    updateOne(query: any, updateOps: UpdateOperation[], options?: queryOption): UpdateOneResponse
    updateMany(query: any, updateOps: UpdateOperation[], options?: queryOption): UpdateManyResponse

    deleteOne(query: any, options?: queryOption): DeleteOneResponse
    deleteMany(query: any, options?: queryOption): DeleteManyResponse

    count(query: any): CountResponse

    findByInternalID(internalID: number): Entity | null

    commit(): void

    abort(): void
}

type DocID = number // the id of a doc is a number
type DocValue = any // the value of a doc is any (json object)
type DocMap = Map<DocID, DocValue>

class TransactionState {
    readCache: DocMap
    writeDocOps: EntityMap
    revision: number
    usedIDs: number[] = []
    private tx: Transaction
    private store: DocStore

    constructor(store: DocStore, tx: Transaction) {
        this.store = store
        this.readCache = new Map()
        this.writeDocOps = new Map()
        this.revision = 0
        this.tx = tx
    }

    reserveID(): number {
        let id = this.store.nextID()
        this.usedIDs.push(id)
        return id
    }

    findOne(query: any): Entity | null {
        // add indexing here currently O(log n)
        let iter = this.writeDocOps.entries()
        for (const [internalID, { entityID, doc }] of iter) {
            for (const prop in query) {
                if (doc[prop] !== query[prop]) continue
            }

            return {
                internalID,
                entityID,
                doc
            }
        }
        return this.store.findOne(query)
    }

    createEntity(doc: any = {}) {
        let internalID = this.reserveID()
        let entityID = new ObjectID().toHexString()

        doc.entityID = entityID

        this.writeDocOps.set(internalID, { entityID, doc })
        return {
            internalID,
            entityID,
            doc
        }
    }

    deleteByInternalID(id: number) {
        this.writeDocOps.delete(id)
    }
}

export class Transaction implements TransactionInterface {
    store: DocStore
    state: TransactionState
    id: string

    constructor(store: DocStore, txID: string) {
        this.store = store
        this.state = new TransactionState(store, this)
        this.id = txID
    }

    insertOne(doc: JSONObject) {
        return this.state.createEntity(doc)
    }

    insertMany(docs: JSONObject[]){ 
        return {
            insertedIDs: docs.map(json => this.insertOne(json))
        }
    }

    findOne(query: any) {
        return this.state.findOne(query)
    }

    findMany(query: any) {
        return this.store.find(query)
    }

    deleteOne(query: any){
        let entity = this.store.findOne(query)

        if(entity) {
            this.state.deleteByInternalID(entity.internalID)
            return { deletedCount: 1 }
        } else {
            return { deletedCount: 0 }
        }
    }

    deleteMany(query: any){
        let deletedCount = 0

        let entities = this.store.find(query)

        entities.map(entity => {
            this.state.deleteByInternalID(entity.internalID)
            deletedCount++
        })

        return { deletedCount }
    }

    updateOne(query: any, updateOps: UpdateOperation[], options?: queryOption) {
        let doc = this.findOne(query)
        let updatedCount = 0

        if(doc) {
            let i = 0, len = updateOps.length
            while(i < len){
                let op = updateOps[i++]
                
                doc = apply(doc, op)
            }
            updatedCount++
        }
        
        return { updatedCount }
    }

    updateMany(query: any, updateOps: UpdateOperation[], options?: queryOption) {
        let docs = this.findMany(query)
        let updatedCount = 0
        
        docs.map(doc => { 
            let i = 0, len = updateOps.length
            while(i < len){
                let op = updateOps[i++]
                
                doc = apply(doc, op)
            }
            updatedCount++
        })
        
        return { updatedCount }
    }

    count(query: any){
        return {
            count: this.findMany(query).length
        }
    }


    findByInternalID(internalID: number) {
        return this.store.findByInternalID(internalID)
    }
    /**
     * This function commits the changes to the database
     */
    commit() {
        let docs = this.state.writeDocOps.entries()

        for (const [id, doc] of docs) {
            this.store.docs.set(id, doc)
        }
    }

    abort() {
        this.store.availableIDs.push(...this.state.usedIDs)
    }
}