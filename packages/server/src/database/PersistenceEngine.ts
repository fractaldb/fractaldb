/*

- update status of in memory log store to persisting
- write all in memory log store to disk
- get the next most recent in memory log store and remove itself from the list

*/

class InMemoryLogStore {
    future: InMemoryLogStore
    past: InMemoryLogStore
    txCount = 0
    maxTxCount = 250

    set isFull (value: boolean) {
        this.txCount = value ? this.maxTxCount : this.txCount
    }
    get isFull () {
        return this.txCount === this.maxTxCount
    }
}

enum PersistenceEngineStatus {
    WAITING,
    PERSISTING
}

class PersistenceEngine {
    leastRecentLogStore: InMemoryLogStore;
    status: PersistenceEngineStatus;

    constructor(logStore: InMemoryLogStore) {
        this.leastRecentLogStore = logStore;
    }

    async persist() {
        while(this.leastRecentLogStore.isFull) {
            this.status = PersistenceEngineStatus.PERSISTING

            await this.write(this.leastRecentLogStore);
            this.leastRecentLogStore = this.leastRecentLogStore.future;
            this.leastRecentLogStore.past = null;
        }
        this.status = PersistenceEngineStatus.WAITING
    }

    async write(logStore: InMemoryLogStore) {

    }
}