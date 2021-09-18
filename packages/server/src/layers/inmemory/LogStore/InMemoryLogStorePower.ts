import DatabaseManager from '../../../managers/DatabaseManager.js'
import ManagesItems from './abstract/ManagesItems.js'
import InMemoryLogStore from './InMemoryLogStore.js'

export default class InMemoryLogStorePower<V> extends ManagesItems<V> {
    collectionName: string
    subcollection: string
    dbname: string
    power: number

    databaseManager: DatabaseManager
    inMemoryLogStore: InMemoryLogStore

    constructor(databaseManager: DatabaseManager, inMemoryLogStore: InMemoryLogStore, dbname: string, collectionName: string, subcollection: string, power: number){
        // TODO, log should pull paramaeters from the older log or lower layers
        super(0, new Set([]), new Set([]))

        this.dbname = dbname
        this.databaseManager = databaseManager
        this.inMemoryLogStore = inMemoryLogStore
        this.collectionName = collectionName
        this.subcollection = subcollection
        this.power = power
    }
}