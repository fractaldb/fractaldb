import { BNode, BNodeInternal } from '@fractaldb/indexing-system/BTreeNode'
import { CollectionManager } from '../../collection/CollectionManager.js'
import { CollectionStateInterface } from '../../collection/CollectionInterface.js'
import { TransactionState } from './TransactionState.js'
import { TransactionSubcollectionState } from './TransactionSubcollectionState.js'
import { BNodeSubcollection } from './subcollections/BNodeSubcollection.js'
import { IndexSubcollection } from './subcollections/IndexSubcollection.js'

export type BNodes<K, V> = BNodeInternal<K, V> | BNode<K, V>

export class TransactionCollection implements CollectionStateInterface {

    txState: TransactionState
    collection: CollectionManager

    // collection metadata here

    docs: TransactionSubcollectionState<any>
    indexes: IndexSubcollection<any, any>
    bnodes: BNodeSubcollection<any, any>

    constructor(collection: CollectionManager, txState: TransactionState){
        this.collection = collection

        this.docs = new TransactionSubcollectionState(this, collection.docs)
        this.indexes = new IndexSubcollection(this, collection.indexes)
        this.bnodes = new BNodeSubcollection(this, collection.bnodes)
        this.txState = txState
    }

    /**
     * Document insert functionality
     *
     * when we insert a doc, we need to:
     * 1. allocate an ID for the doc
     * 2. getIndexesForDoc() returns a list of indexes to insert into
     * 3. insert ID as value for each index, using the doc's index path as the key
     * 2. index.autoAdd(doc, id) // automatically adds the doc to the index if it belongs there
     * 2. add the doc to the transaction's doc subcollection
     */
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

}