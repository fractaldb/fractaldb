import Transaction, { TxStatuses } from '../../layers/transaction/Transaction.js'
import TransactionSubcollection from '../../layers/transaction/TransactionSubcollection.js'
import Deferred from '../../utils/Deferred.js'
import { SubcollectionManager } from '../SubcollectionManager.js'

export class DeadLockError extends Error {
    code = 'DeadLockError'
}

export type LockItem = { tx: Transaction, deferred: Deferred<void> }

export class LockQueue<V> {
    subcollection: SubcollectionManager<V>
    resource: number
    items: LockItem[] = []

    constructor(resource: number, subcollection: SubcollectionManager<V>) {
        this.resource = resource
        this.subcollection = subcollection
    }

    get isEmpty() {
        return this.items.length === 0
    }

    next() {
        if(this.items.length === 0) {
            this.subcollection.lockQueue.delete(this.resource)
        }
        if(this.items[0].tx.status === TxStatuses.ABORTED) {
            this.items.shift()
            this.next()
        } else {
            this.items[0].deferred.resolve()
        }
    }

    async getLockPromise(subcollection: TransactionSubcollection<V>) {
        let shouldCallNext = this.isEmpty
        let lockItem = this.items.find(item => item.tx === subcollection.tx)
        if(!lockItem) {
            lockItem = { tx: subcollection.tx, deferred: new Deferred<void>()}
            this.items.push(lockItem)
            if(shouldCallNext) this.next()
        }
        await lockItem.deferred.promise
        subcollection.releaseLockCallbacks.push(() => { // lock release function
            this.items.shift()
            this.next()
        })
    }
}