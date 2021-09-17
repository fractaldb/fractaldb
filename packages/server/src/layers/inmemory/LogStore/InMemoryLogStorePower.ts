import DatabaseManager from '../../../managers/DatabaseManager.js'
import InMemoryLogStore from './InMemoryLogStore.js'

export default class InMemoryLogStorePower<V> {
    collectionName: string
    subcollection: string
    dbname: string
    power: number

    databaseManager: DatabaseManager
    inMemoryLogStore: InMemoryLogStore

    items: Map<number, V> = new Map()

    constructor(databaseManager: DatabaseManager, inMemoryLogStore: InMemoryLogStore, dbname: string, collectionName: string, subcollection: string, power: number){
        this.dbname = dbname
        this.databaseManager = databaseManager
        this.inMemoryLogStore = inMemoryLogStore
        this.collectionName = collectionName
        this.subcollection = subcollection
        this.power = power
    }
}