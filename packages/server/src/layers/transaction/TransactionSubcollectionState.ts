import { SubcollectionManager } from '../../subcollection/SubcollectionManager.js'
import { SubcollectionStateInterface } from '../../subcollection/SubcollectionInterface.js'
import { InMemorySubcollectionState } from '../inmemory/InMemorySubcollection.js'
import { Transaction } from './Transaction.js'
import { TransactionCollectionState } from './TransactionCollection.js'

export class TransactionSubcollectionState<V> implements SubcollectionStateInterface<V> {
    subcollectionManager: SubcollectionManager<V>
    collectionState: TransactionCollectionState<V>

    values: Map<number, V | null> = new Map()
    releaseLockCallbacks: (() => void)[] = []
    assignedIds: Set<number> = new Set()
    freeIds: Set<number> = new Set()

    constructor(
        collectionState: TransactionCollectionState<V>,
        subcollectionManager: SubcollectionManager<V>) {
        this.subcollectionManager = subcollectionManager
        this.collectionState = collectionState
    }

    get tx () {
        return this.collectionState.txState.tx
    }

    // TODO: we have to acquire locks for all resources

    async get(id: number): Promise<V | null> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx)
        let val = this.values.get(id)

        if (val !== undefined) { // the value exists or is null so return that
            return val
        }

        return await this.subcollectionManager.inMemory.get(id)
    }


    async hasLocal(id: number): Promise<boolean> {
        return this.values.has(id)
    }

    async set(id: number, value: V): Promise<void> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx)
        this.values.set(id, value)
    }

    async remove(id: number): Promise<void> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx)
        this.values.set(id, null)
    }

    async getID(): Promise<number> {
        // check if there are any free IDs available in this subcollection, and return the first one
        if (this.freeIds.size > 0) {
            let id = this.freeIds.values().next().value
            this.freeIds.delete(id)
            return id
        }
        // if not, then get the subcollection to allocate a new ID to this transaction/subcollection
        let id = await this.subcollectionManager.getID()
        this.assignedIds.add(id)
        return id
    }


}