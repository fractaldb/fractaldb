import { Database } from '../../database/Database.js'
import { Transaction } from './Transaction.js'
import { PropertyIndex, ValueIndex } from '@fractaldb/indexing-system/src'
import { BNode, BNodeInternal } from '@fractaldb/indexing-system/BTreeNode.js'

/**
 * Transaction State Store
 *
 * This keeps track of any local state changes of docs & indexes in transactions
 * Anything that cannot be found in here searches the in-memory database next
 *
 * The transaction state is isolated to a single transaction
 *
 * We need to keep track of deletes and ensure that we don't read a doc from other layers of stores
 */
export class TransactionState {

    database: Database
    tx: Transaction

    deletedRootIndexes: Set<number> = new Set()
    rootIndexes: Set<number> = new Set()

    indexes: Map<number, PropertyIndex<any> | null> = new Map()

    bnodes: Map<number, BNode<any, any> | BNodeInternal<any, any> | null> = new Map()

    docs: Map<number, any> = new Map()

    constructor(tx: Transaction){
        this.tx = tx
        this.database = tx.database
    }

    /**
     * Get the index with a certain ID
     *
     * Check if it exists in the current map of indexes, otherwise
     * try to search the in-memory db for the index.
     */
    async getIndex(id: number) {
        // check if the index is deleted, if it is then return null
        let index = this.indexes.get(id)

        // if the value is null, then the value was deleted
        if (index === null) return null

        // if the value is undefined (not set), then we need to search the in-memory db
        if (index === undefined) return await this.database.getIndex(id)

        return index
    }

    /**
     * Get the BNode with a certain ID
     *
     * Check if it exists in the current map of BNodes, otherwise
     * try to search the in-memory db for the index
     */
    async getBNode(id: number): BNode | null {
        let bnode = this.bnodes.get(id)

        // if the value is null, then the value was deleted
        if (bnode === null) return null

        // if the value is undefined (not set), then we need to search the in-memory db
        if (bnode === undefined) return await this.database.getBNode(id)

        return bnode
    }

    /**
     * FindIndexForQuery
     *
     * We have to find the root indexes to add an item to for the given search query
     *
     * example query:
     * {
     *      type: 'user'
     *      organisation: a
     *      statements.instanceof: 'task'
     * }
     */
    async findIndexForQuery(query: any) {

        let i = 0
        while (i < this.rootIndexes.length) {
            let index = await this.getIndex(this.rootIndexes[i])

            if (index) {
                let i2 = 0
                let keys = Object.keys(query)
                while (i2 < keys.length) {
                    let key = keys[i2]



                    i2++
                }
            }
            i++
        }
    }
    /**
     * Find operation
     *
     * Uses an index to find a doc by the query. Checks in-memory first, then the store
     * Ensures that we don't read doc from next layer if it was deleted
     */
    async find(query: any) {

        //todo
    }

    /**
     * Delete operation
     */
    async delete(id: number) {
        this.deletedDocs.push(query.id)
    }
}