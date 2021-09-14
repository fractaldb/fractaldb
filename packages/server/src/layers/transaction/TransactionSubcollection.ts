import { Commands, LogCommand } from '../../logcommands/index.js'
import { SubcollectionManager } from '../../managers/SubcollectionManager.js'
import Transaction from './Transaction.js'


export default class TransactionSubcollection<V> {

    items: Map<number, V> = new Map()
    subcollectionManager: SubcollectionManager<V>
    tx: Transaction

    releaseLockCallbacks: (() => void)[] = []
    assignedIds: Set<number> = new Set()
    freeIds: Set<number> = new Set()

    constructor(tx: Transaction, subcollectionManager: SubcollectionManager<V>) {
        this.tx = tx
        this.subcollectionManager = subcollectionManager
    }

    async get(id: number): Promise<V | null> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx, this)

        // get item from subcollection state
        const item = this.items.get(id)
        if(item !== undefined) { // the value exists or is null so return that
            return item
        }

        // not in local state, try to get from InMemory system

        return this.subcollectionManager.inMemoryLayer.get(id)
    }

    getWrites(): LogCommand[] {
        let writes: LogCommand[] = []
        for (let [id, value] of this.items) {
            writes.push([
                Commands.SetSubcollectionData,
                this.subcollectionManager.db,
                this.subcollectionManager.collection,
                this.subcollectionManager.name,
                id,
                value
            ])
        }
        return writes
    }

    releaseLocks(){
        for (let callback of this.releaseLockCallbacks) {
            callback()
        }
        this.releaseLockCallbacks = []
    }

    async set(id: number, value: V): Promise<void> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx, this)

        // set item in local state
        this.items.set(id, value)
    }

    async allocateID(): Promise<number> {
        // check if there are any free IDs available in this transaction's subcollection, and return the first one
        if (this.freeIds.size > 0) {
            let id = this.freeIds.values().next().value as number
            this.freeIds.delete(id)
            return id
        }
        // if not, then get the subcollection to allocate a new ID to this transaction/subcollection
        let id = await this.subcollectionManager.allocateID()
        this.assignedIds.add(id)
        return id
    }
}