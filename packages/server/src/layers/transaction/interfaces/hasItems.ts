import Transaction from '../Transaction'


export interface hasItems<V> {
    items: Map<number, V | null>
    tx: Transaction

    releaseLockCallbacks: (() => void)[]
    assignedIds: Set<number>
    freeIds: Set<number>

    releaseLocks(): void
    allocateID(): Promise<number>
}