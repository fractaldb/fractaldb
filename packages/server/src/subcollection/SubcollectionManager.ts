import { DeadLockError, LockExistsError, LockQueue } from '../subcollection/LockQueue.js'
import { CollectionManager } from '../collection/CollectionManager'
import { Transaction, WaitingOn } from '../layers/transaction/Transaction.js'
import { InMemorySubcollection } from '../layers/inmemory/InMemorySubcollection.js'

/**
 * Subcollection is the base class for all subcollections
 *
 * There are 3 types of subcollections that use this class:
 * docs: store the values of a collection
 * index: store the indexes which index the docs
 * bnodes: store the bnode data structure used by the index
 *
 * Each have their own ID allocations (eg: there can be an index, bnode and docs all with the same ID)
 *
 * Subcollection is managed by the Database and keeps track of ID allocations,
 * free spaces? locks, etc.
 *
 * A subcollection is part of a collection.
 */
export class SubcollectionManager {
    collection: CollectionManager

    type: string
    inMemory: InMemorySubcollection
    // lru
    // disk

    lockQueue: Map<number, LockQueue<V>> = new Map()
    freeIDs: Set<number> = new Set()
    nextHighestID: number

    // function to allocate the next available id
    async getID(): Promise<number> {
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


    constructor(collection: CollectionManager, type: string) {
        this.inMemory = new InMemorySubcollection(this)
        this.collection = collection
        this.type = type
        this.nextHighestID = 0
    }


    findOrCreateQueue(resource: number): LockQueue {
        if (!this.lockQueue.has(resource)) { // no existing queue, create one
            let queue = new LockQueue(resource, this)
            this.lockQueue.set(resource, queue)
            return queue
        }
        return this.lockQueue.get(resource) as LockQueue // return existing queue
    }


    /**
     * Check if the current transaction has an acquired lock on this resource already
     */
    hasLock(resource: number, tx: Transaction): boolean {
        let queue = this.lockQueue.get(resource)
        if(!queue) return false
        return queue.items[0].tx === tx
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
    async tryToAcquireLock(resource: number, tx: Transaction): Promise<void> {
        tx.waitingOn = [this.collection.name, this.type, resource]

        let queue = this.findOrCreateQueue(resource)

        // check if we already have a lock, or in the queue to acquire
        let lockPromise = queue.push(tx)

        if (queue.items[0].tx === tx) {
            throw new LockExistsError(`Lock on resource: ${resource} exists hasLock was not called`)
        }

        // imagine if transaction 1 (currentTx) previously acquired a lock on resource 1
        // and hasn't released it yet, transaction 1 is waiting on resource 2 which was locked by
        // transaction 2, and transaction 2 (tx) is now trying to acquire a lock on resource 1
        // this results in a deadlock that cannot be resolved without cancelling one of the transactions

        let currentTx: Transaction
        let currentQueue: LockQueue = queue

        while (true) {
            currentTx = currentQueue.items[0].tx
            if (currentTx === tx) { // deadlock has occured
                throw new DeadLockError('Deadlock has occured')
            } else if (currentTx.waitingOn !== undefined) { // waiting on something
                // get the transaction holding the lock
                if(this.collection.name !== currentTx.waitingOn[0]) break
                if(this.type !== currentTx.waitingOn[1]) break
                currentQueue = this.lockQueue.get(currentTx.waitingOn[2]) as LockQueue
                continue
            } else {
                break
            }
        }

        await lockPromise
        tx.waitingOn = undefined
    }
}