export default abstract class ManagesIDAllocation {
    highestID: number

    usedIDs: Set<number>
    freeIDs: Set<number>

    constructor(IDInformation: IDInformation) {
        this.highestID = IDInformation.highestID
        this.usedIDs = new Set(IDInformation.usedIDs)
        this.freeIDs = new Set(IDInformation.freeIDs)
    }
}

export type IDInformation = {
    highestID: number
    usedIDs: Set<number>
    freeIDs: Set<number>
}