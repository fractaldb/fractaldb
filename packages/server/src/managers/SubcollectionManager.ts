import { DeadLockError, LockQueue } from './subcollection/LockQueue.js'
import Transaction from '../layers/transaction/Transaction.js'
import { FractalServer } from '../database/Server.js'
import InMemoryMockSubcollection from '../layers/inmemory/InMemoryMockSubcollection.js'
import TransactionSubcollection from '../layers/transaction/TransactionSubcollection.js'

/**
 * Subcollection is the base class for all subcollections
 *
 * There are a number of types of subcollections that use this class:
    * nodes: store the nodes of a collection
    * index: store the indexes which index the docs
    * index-power: arrays of indexes by their power of 2
    * bnodes: store the bnode data structure used by the index
    * bnode-power: arrays of bnodes by their power of 2
    * values-power: arrays of values by their power of 2
 *
 * Each have their own ID allocation systems (eg: there can be an index, bnode and docs all with the same ID)
 *
 * Subcollection is managed by the Database and keeps track of ID allocations, free ids, locks, etc.
 *
 * A subcollection is part of a collection.
 */
export class SubcollectionManager<V> {
    server: FractalServer
    db: string
    collection: string
    name: string

    /**
     * The mock inMemoryLayer that represents this subcollection
     */
    inMemoryLayer: InMemoryMockSubcollection<V>

    lockQueue: Map<number, LockQueue<V>> = new Map()
    freeIDs: Set<number> = new Set()
    nextHighestID: number

    constructor(server: FractalServer, db: string, collection: string, name: string) {
        this.server = server
        this.db = db
        this.collection = collection
        this.name = name
        this.nextHighestID = 0
        this.inMemoryLayer = new InMemoryMockSubcollection(server, db, collection, name)
    }

    /**
     * Allocate a new ID
     */
    async allocateID(): Promise<number> {
        if (this.freeIDs.size === 0) {
            this.nextHighestID++
            return this.nextHighestID - 1
        } else {
            let id = this.freeIDs.values().next().value
            this.freeIDs.delete(id)
            return id
        }
    }

    async releaseID(id: number) {
        this.freeIDs.add(id)
    }


    findOrCreateQueue(resource: number): LockQueue<V> {
        if (!this.lockQueue.has(resource)) { // no existing queue, create one
            let queue = new LockQueue(resource, this)
            this.lockQueue.set(resource, queue)
            return queue
        }
        return this.lockQueue.get(resource) as LockQueue<V> // return existing queue
    }

    /**
     * Try to acquire a lock or throw an error if a deadlock is required
     *
     * Before you call tryToAcquireLock, check if you already have a lock first
     *
     * - transaction trys to acquire a lock
     *  - if it acquires lock
     *      - do the operation
     *  - if there is an existing lock
     *      - add transaction to queue
     *      - if the existing lock is owned by the same transaction
     *          - continue
     *      - else
     *          - create a variable TX to keep track of transaction
     *          - get the transaction holding the lock
     *          - while true
     *              - if the transaction is the same as the current transaction
     *                  - return error
     *              - else if transaction is waiting for a lock
     *                  - get the transaction holding the lock and store it in the variable TX
     *                  - continue
     *              - else
     *                  - break
     *          - wait for lock to release, and then acquire it
     *          - acquire lock
     *              - do the operation
     *          - release lock
     */
    async tryToAcquireLock(resource: number, tx: Transaction, subcollection: TransactionSubcollection<V>): Promise<void> {
        tx.waitingOn = [this.db, this.collection, this.name, resource]

        let queue = this.findOrCreateQueue(resource)

        // check if we have a lock already, use that if we do, otherwise enter queue
        let lockPromise = queue.getLockPromise(subcollection)

        // imagine if transaction 1 (currentTx) previously acquired a lock on resource 1
        // and hasn't released it yet, transaction 1 is waiting on resource 2 which was locked by
        // transaction 2, and transaction 2 (tx) is now trying to acquire a lock on resource 1
        // this results in a deadlock that cannot be resolved without cancelling one of the transactions

        let currentTx: Transaction
        let currentQueue: LockQueue<V> = queue

        if(currentQueue.items[0].tx !== tx) {
            while (true) {
                currentTx = currentQueue.items[0].tx
                if (currentTx === tx) { // deadlock has occured
                    throw new DeadLockError('Deadlock has occured')
                } else if (currentTx.waitingOn !== undefined) { // waiting on something
                    // get the transaction holding the lock
                    if(this.db !== currentTx.waitingOn[0]) break
                    if(this.collection !== currentTx.waitingOn[1]) break
                    if(this.name !== currentTx.waitingOn[2]) break
                    currentQueue = this.lockQueue.get(currentTx.waitingOn[3]) as LockQueue<V>
                    continue
                } else {
                    break
                }
            }
        }

        await lockPromise
        tx.waitingOn = undefined
    }
}