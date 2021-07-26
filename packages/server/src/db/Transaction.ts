import { DocStore, EntityMap, matchesQuery } from './DocStore.js'
import { apply, UpdateOperation } from '@fractaldb/shared/utils/JSONPatch.js'
import { InsertManyResponse } from '@fractaldb/shared/operations/InsertMany.js'
import { InsertOneResponse } from '@fractaldb/shared/operations/InsertOne.js'
import { FindOneResponse } from '@fractaldb/shared/operations/FindOne.js'
import { FindManyResponse } from '@fractaldb/shared/operations/FindMany.js'
import { UpdateOneResponse } from '@fractaldb/shared/operations/UpdateOne.js'
import { UpdateManyResponse } from '@fractaldb/shared/operations/UpdateMany.js'
import { DeleteOneResponse } from '@fractaldb/shared/operations/DeleteOne.js'
import { DeleteManyResponse } from '@fractaldb/shared/operations/DeleteMany.js'
import { CountResponse } from '@fractaldb/shared/operations/Count.js'
import { Entity } from '@fractaldb/shared/utils/Entity.js'
import { EntityID } from '@fractaldb/adn/EntityID.js'
import { Database } from './Database.js'

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

    findByEntityID(entityID: EntityID): Entity | null

    commit(): void

    abort(): void
}

type DocMap = Map<number, Entity>

class TransactionState {
    readCache: DocMap
    writeDocOps: EntityMap
    revision: number
    usedIDs: number[] = []
    private tx: Transaction
    database: Database

    constructor(db: Database, tx: Transaction) {
        this.database = db
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
        for (const [internalID, doc] of iter) {
            if(matchesQuery(doc, query)) {
                return doc
            }

            return doc
        }
        return this.store.findOne(query)
    }

    updateEntity(entity: Entity) {
        this.writeDocOps.set(entity.entityID.internalID, entity)
    }

    createEntity(doc: any = {}): Entity {
        let entityID = new EntityID(this.reserveID())

        doc.entityID = entityID

        this.writeDocOps.set(entityID.internalID, doc)

        return doc
    }

    deleteByInternalID(id: number) {
        this.writeDocOps.delete(id)
    }
}

export class Transaction implements TransactionInterface {
    database: Database
    state: TransactionState
    id: string
    waitingOn?: number


    constructor(db: Database, txID: string) {
        this.database = db
        this.state = new TransactionState(db, this)
        this.id = txID
    }

    insertOne(doc: Entity) {
        return this.state.createEntity(doc).entityID as EntityID
    }

    insertMany(docs: Entity[]){
        return {
            insertedIDs: docs.map(json => this.insertOne(json))
        }
    }

    findOne(query: any) {
        return this.state.findOne(query)
    }

    findMany(query: any) {
        return this.state.find(query)
    }

    deleteOne(query: any){
        let entity = this.state.findOne(query)

        if(entity) {
            this.state.deleteByInternalID(entity.internalID)
            return { deletedCount: 1 }
        } else {
            return { deletedCount: 0 }
        }
    }

    deleteMany(query: any){
        let deletedCount = 0

        let entities = this.state.find(query)

        entities.map(entity => {
            this.state.deleteByInternalID(entity.internalID)
            deletedCount++
        })

        return { deletedCount }
    }

    updateOne(query: any, updateOps: UpdateOperation[], options?: queryOption) {
        let entity = this.findOne(query) as Entity
        let updatedCount = 0

        if(entity) {
            let i = 0, len = updateOps.length
            while(i < len){
                let op = updateOps[i++]
                let adn = this.state.server.adn
                entity = apply(adn.deserialize(adn.serialize(entity)), op) //serializing & deserializing creates an effective clone of the entity
                this.state.updateEntity(entity)
            }
            updatedCount++
        }

        return { updatedCount }
    }

    updateMany(query: any, updateOps: UpdateOperation[], options?: queryOption) {
        let entities = this.findMany(query)
        let updatedCount = 0

        entities.map(entity => {
            let i = 0, len = updateOps.length
            while(i < len){
                let op = updateOps[i++]

                let adn = this.database.server.adn
                entity = apply(adn.deserialize(adn.serialize(entity)), op)
                this.state.updateEntity(entity)
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


    findByEntityID(entityID: EntityID) {
        return this.store.findByEntityID(entityID)
    }
    /**
     * This function commits the changes to the log, and then to the in-memory database
     */
    commit() {
        let docs = this.state.writeDocOps.entries()

        for (const [id, doc] of docs) {
            this.store.docs.set(id, doc)
        }
    }

    abort() {
        this.state.availableIDs.push(...this.state.usedIDs)
    }
}