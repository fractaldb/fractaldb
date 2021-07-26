import { number } from 'yargs'
import { Transaction } from './Transaction.js'

export class LockExistsError extends Error {
    code = 'LockExistsError'
}

export class DeadLockError extends Error {
    code = 'DeadLockError'
}

class LockQueue {
    database: Database
    resource: number
    items: { tx: Transaction, acquire: () => void }[] = []

    constructor(resource: number, database: Database) {
        this.resource = resource
        this.database = database
    }

    get isEmpty() {
        return this.items.length === 0
    }

    next() {
        if(this.items.length === 0) {
            this.database.lockQueue.delete(this.resource)
        }
        this.items[0].acquire()
    }

    async push(tx: Transaction) {
        await new Promise(resolve => {
            let shouldCallNext = this.isEmpty
            this.items.push({ tx, acquire: resolve as () => void })
            if(shouldCallNext) this.next()
        })
        return () => { // lock release function
            this.items.shift()
            this.next()
        }
    }
}

export class Database {

    lockQueue: Map<number, LockQueue> = new Map()

    findOrCreateQueue(resource: number) {
        if (!this.lockQueue.has(resource)) { // no existing queue, create one
            let queue = new LockQueue(resource, this)
            this.lockQueue.set(resource, queue)
            return queue
        }
        return this.lockQueue.get(resource) as LockQueue // return existing queue
    }

    async getIndex(id: number) {

    }

    async getBNode(id: number) {

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
    async tryToAcquireLock(resource: number, tx: Transaction): Promise<() => void> {
        tx.waitingOn = resource

        let queue = this.findOrCreateQueue(resource)
        let releaseLockPromise = queue.push(tx)

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
                currentQueue = this.lockQueue.get(currentTx.waitingOn) as LockQueue
                continue
            } else {
                break
            }
        }


        let lockPromise = await releaseLockPromise
        tx.waitingOn = undefined
        return lockPromise
    }
}