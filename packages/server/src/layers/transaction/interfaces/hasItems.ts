import Transaction from '../Transaction'


export interface hasItems {
    items: Map<number, string | null>
    tx: Transaction

    releaseLockCallbacks: (() => void)[]
    assignedIds: Set<number>
    freeIds: Set<number>

    releaseLocks(): void
    allocateID(): Promise<number>
}