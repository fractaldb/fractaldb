export default abstract class ManagesItems {
    items: Map<number, string | null> = new Map()

    highestID: number

    usedIDs: Set<number>
    freeIDs: Set<number>

    constructor(){
        this.highestID = 1
        this.usedIDs = new Set()
        this.freeIDs = new Set()
    }
}