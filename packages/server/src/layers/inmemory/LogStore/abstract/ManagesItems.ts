export default abstract class ManagesItems<V> {
    items: Map<number, V| null> = new Map()

    highestID: number

    usedIDs: Set<number>
    freeIDs: Set<number>

    constructor(highestID: number, usedIDs: Set<number>, freeIDs: Set<number>){
        this.highestID = highestID
        this.usedIDs = new Set(usedIDs)
        this.freeIDs = new Set(freeIDs)
    }

    async freeID(id: number): Promise<void> {
        // TODO: we should log this id as being "free" in the log for this layer in heirarchy
        this.freeIDs.add(id)
    }

    /**
     * Allocate a new ID
     */
    async allocateID(): Promise<number> {
        if (this.freeIDs.size === 0) {
            // increment the highest ID

            // TODO: we should log the fact that we're allocating a new highest ID
            // TODO: we should also log the fact that we're "free"-ing this new ID
            // this id should be added to the usedIDs set
            let id = ++this.highestID
            this.usedIDs.add(id)
            return id
        } else {
            let id = this.freeIDs.values().next().value
            this.freeIDs.delete(id)
            this.usedIDs.add(id)
            return id
        }
    }
}