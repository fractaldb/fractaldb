import { DocStore, EntityMap, matchesQuery } from '../inmemory/DocStore.js'
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
import { Database } from '../../database/Database.js'

interface queryOption {
    projection: any
    sort: any
}

export enum TxStatuses {
    ABORTED = 'aborted', // or failed
    COMMITING = 'committing',
    COMMITTED = 'committed',
    ACTIVE = 'active',
    INACTIVE = 'inactive'
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

export type WaitingOn = [collection: string, type: string, resource: number]

export class Transaction implements TransactionInterface {
    database: Database
    state: TransactionState
    id: string
    waitingOn?: WaitingOn
    status: TxStatuses


    constructor(db: Database, txID: string) {
        this.database = db
        this.state = new TransactionState(db, this)
        this.id = txID
    }

    /**
     * This function commits the changes to the log, and then to the in-memory database
     */
    commit() {
        // let docs = this.state.writeDocOps.entries()

        // for (const [id, doc] of docs) {
        //     this.store.docs.set(id, doc)
        // }
    }

    abort() {
        this.state.availableIDs.push(...this.state.usedIDs)
    }
}