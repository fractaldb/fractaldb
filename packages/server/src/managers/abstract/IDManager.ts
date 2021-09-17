import { DeadLockError, LockQueue } from '../subcollection/LockQueue.js'
import Transaction from '../../layers/transaction/Transaction.js'
import { hasItems } from '../../layers/transaction/interfaces/hasItems.js'

export type LockPath = [db: string, collection: string, subcollection: string]

/**
 * Global lock queue system idea:
 *
 * locks: Map<ADNString, LockQueue>
 */

export default abstract class IDManager<V> {

    lockQueue: Map<number, LockQueue<V>> = new Map()
    freeIDs: Set<number> = new Set()
    nextHighestID: number
    path: LockPath

    constructor(path: LockPath){
        this.path = path
        this.nextHighestID = 0
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
    async tryToAcquireLock(resource: number, tx: Transaction, hasItems: hasItems<V>): Promise<void> {
        tx.waitingOn = [...this.path, resource]

        let queue = this.findOrCreateQueue(resource)

        // check if we have a lock already, use that if we do, otherwise enter queue
        let lockPromise = queue.getLockPromise(hasItems)

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
                    if(this.path[0] !== currentTx.waitingOn[0]) break // dn
                    if(this.path[1] !== currentTx.waitingOn[1]) break // collection
                    if(this.path[2] !== currentTx.waitingOn[2]) break // subcollection (nodes, index, bnodes, etc)
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