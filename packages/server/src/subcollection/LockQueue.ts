
import { Database } from '../database/Database.js'
import { Transaction, TxStatuses } from '../layers/transaction/Transaction.js'
import { TransactionSubcollectionState } from '../layers/transaction/TransactionSubcollectionState.js'
import { SubcollectionManager } from './SubcollectionManager.js'

export class LockExistsError extends Error {
    code = 'LockExistsError'
}

export class DeadLockError extends Error {
    code = 'DeadLockError'
}

export class LockQueue<V> {
    subcollection: SubcollectionManager<V>
    resource: number
    items: { tx: Transaction, acquire: (id: number) => void, promise: Promise<number> }[] = []

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
            this.items[0].acquire(this.resource)
        }
    }

    async push(substate: TransactionSubcollectionState<any>) {
        let promise = await new Promise(resolve => {
            let shouldCallNext = this.isEmpty
            this.items.push({ promise, tx: substate.tx, acquire: resolve as () => void })
            if(shouldCallNext) this.next()
        })

        substate.releaseLockCallbacks.push(() => { // lock release function
            this.items.shift()
            this.next()
        })
    }
}