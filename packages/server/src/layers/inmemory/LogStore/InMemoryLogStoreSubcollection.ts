import DatabaseManager from '../../../managers/DatabaseManager.js'
import { RecordValue } from '../../../structures/DataStructures.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStorePower from './InMemoryLogStorePower.js'

export default class InMemoryLogStoreSubcollection<V> {
    collectionName: string
    name: string
    dbname: string
    databaseManager: DatabaseManager
    inMemoryLogStore: InMemoryLogStore

    items: Map<number, RecordValue> = new Map()
    powers: Map<number, InMemoryLogStorePower<V>> = new Map()

    constructor(databaseManager: DatabaseManager, inMemoryLogStore: InMemoryLogStore, dbname: string, collectionName: string, name: string){
        this.dbname = dbname
        this.databaseManager = databaseManager
        this.inMemoryLogStore = inMemoryLogStore
        this.collectionName = collectionName
        this.name = name
    }
}