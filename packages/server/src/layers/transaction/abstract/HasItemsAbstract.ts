import ManagesItems from '../../inmemory/LogStore/abstract/ManagesItems'

export default abstract class HasItemsAbstract<V> {
    items: Map<number, V | null> = new Map()
    manager: ManagesItems<V>

    releaseLockCallbacks: (() => void)[] = []
    assignedIds: Set<number> = new Set()
    freeIds: Set<number> = new Set()

    constructor(manager: ManagesItems<V>){
        this.manager = manager
    }

    releaseLocks(){
        for (let callback of this.releaseLockCallbacks) {
            callback()
        }
        this.releaseLockCallbacks = []
    }

    async allocateID(): Promise<number> {
        // check if there are any free IDs available in this transaction's subcollection, and return the first one
        if (this.freeIds.size > 0) {
            let id = this.freeIds.values().next().value as number
            this.freeIds.delete(id)
            return id
        }
        // if not, then get the subcollection to allocate a new ID to this transaction/subcollection
        let id = await this.manager.allocateID()
        this.assignedIds.add(id)
        return id
    }
}