import { hasItems } from '../layers/transaction/interfaces/hasItems.js'
import Transaction, { TxStatuses } from '../layers/transaction/Transaction.js'
import Deferred from '../utils/Deferred.js'
import LockEngine from './LockSystem.js'

export class DeadLockError extends Error {
    code = 'DeadLockError'
}

export type LockItem = { tx: Transaction, deferred: Deferred<void> }

export class LockQueue {
    lockEngine: LockEngine
    resource: string
    items: LockItem[] = []

    constructor(resource: string, lockEngine: LockEngine) {
        this.resource = resource
        this.lockEngine = lockEngine
    }

    get isEmpty() {
        return this.items.length === 0
    }

    next() {
        if(this.isEmpty) {
            return delete this.lockEngine.locks[this.resource]
        }
        if(this.items[0].tx.status === TxStatuses.ABORTED) {
            this.items.shift()
            this.next()
        } else {
            this.items[0].deferred.resolve()
        }
    }

    async getLockPromise(hasItems: hasItems) {
        let shouldCallNext = this.isEmpty
        let lockItem = this.items.find(item => item.tx === hasItems.tx)
        if(!lockItem) {
            lockItem = { tx: hasItems.tx, deferred: new Deferred<void>()}
            this.items.push(lockItem)
            if(shouldCallNext) this.next()
        }
        await lockItem.deferred.promise
        hasItems.releaseLockCallbacks.push(() => { // lock release function
            this.items.shift()
            this.next()
        })
    }
}