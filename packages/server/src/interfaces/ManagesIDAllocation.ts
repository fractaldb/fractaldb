export default abstract class ManagesIDAllocation {
    items: Map<number, string | null> = new Map()

    highestID: number

    usedIDs: Set<number>
    freeIDs: Set<number>

    constructor(){
        this.highestID = 0
        this.usedIDs = new Set()
        this.freeIDs = new Set()
    }
}