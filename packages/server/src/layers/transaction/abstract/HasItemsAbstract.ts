import AllocatesIDsInterface from '../../../interfaces/AllocatesIDsInterface.js'
export default abstract class HasItemsAbstract {
    items: Map<number, string | null> = new Map()
    allocator: AllocatesIDsInterface

    releaseLockCallbacks: (() => void)[] = []
    assignedIds: Set<number> = new Set()
    freeIds: Set<number> = new Set()

    constructor(allocator: AllocatesIDsInterface){
        this.allocator = allocator
    }

    releaseLocks(){
        for (let callback of this.releaseLockCallbacks) {
            callback()
        }
        this.releaseLockCallbacks = []
    }

    releaseUsedIDs() {
        for (let id of this.assignedIds) {
            this.allocator.usedIDs.delete(id)
            this.allocator.freeIDs.add(id)
        }
        this.assignedIds.clear()
    }

    async allocateID(): Promise<number> {
        // check if there are any free IDs available in this transaction's subcollection, and return the first one
        if (this.freeIds.size > 0) {
            let id = this.freeIds.values().next().value as number
            this.freeIds.delete(id)
            return id
        }
        // if not, then get the subcollection to allocate a new ID to this transaction/subcollection
        let id = await this.allocator.allocateID()
        this.assignedIds.add(id)
        return id
    }
}