
export interface BaseOperation {
    txID?: string // transaciton id that is generated by the cleint (UUIDV4)
    op: string
}