import { FractalServer } from '../database/Server.js'
import HasItemsAbstract from '../layers/transaction/abstract/HasItemsAbstract.js'
import { hasItems } from '../layers/transaction/interfaces/hasItems.js'
import Transaction from '../layers/transaction/Transaction.js'
import { DeadLockError, LockQueue } from './LockQueue.js'


export default class LockEngine {

    locks: {
        [key: string]: LockQueue | undefined
    }

    constructor(server: FractalServer){
        this.locks = {}
    }

    findOrCreateQueue(resource: string): LockQueue {
        let queue = this.locks[resource]
        if(!queue){ // no existing queue, create one
            queue = new LockQueue(resource, this)
            this.locks[resource] = queue
        }
        return queue
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
    async tryToAcquireLock(resource: string, tx: Transaction, hasItems: hasItems): Promise<void> {
        tx.waitingOn = resource

        let queue = this.findOrCreateQueue(resource)

        // check if we have a lock already, use that if we do, otherwise enter queue
        let lockPromise = queue.getLockPromise(hasItems)

        // imagine if transaction 1 (currentTx) previously acquired a lock on resource 1
        // and hasn't released it yet, transaction 1 is waiting on resource 2 which was locked by
        // transaction 2, and transaction 2 (tx) is now trying to acquire a lock on resource 1
        // this results in a deadlock that cannot be resolved without cancelling one of the transactions

        // deadlock resolution algorithm:

        // - transaction trys to acquire a lock
        //   - if it acquires lock
        //     - do the operation
        //   - if there is an existing lock
        //     - add transaction to queue
        //     - if the existing lock is owned by the same transaction
        //         - continue
        //     - else
        //         - create a variable TX to keep track of transaction
        //         - get the transaction holding the lock
        //         - while true
        //             - if the transaction is the same as the current transaction
        //                 - return error
        //             - else if transaction is waiting for a lock
        //                 - get the transaction holding that new lock and store it in the variable TX
        //                 - continue
        //             - else
        //                 - break
        //         - wait for lock to release, and then acquire it
        //         - acquire lock
        //             - do the operation
        //         - release lock

        if(queue.items[0].tx !== tx) { // if the transaction is not the first in the queue
            let currentTx: Transaction = queue.items[0].tx // get the transaction that is currently holding the lock

            while (true) {
                if (currentTx === tx) { // deadlock has occured
                    throw new DeadLockError('Deadlock has occured')
                } else if (currentTx.waitingOn !== undefined) {
                    // the currentTx is waiting on something
                    // get the transaction that is currently holding the lock
                    currentTx = (this.locks[currentTx.waitingOn] as LockQueue).items[0].tx

                    // we have to wait because this could go on forever,
                    // and never let the transaction holding the lock finish
                    await new Promise(resolve => setImmediate(resolve))

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