import DatabaseManager from '../../../managers/DatabaseManager.js'
import { RecordValue } from '../../../structures/DataStructures.js'
import { SubcollectionInterface } from '../../../interfaces/SubcollectionInterface.js'
import ManagesItems from './abstract/ManagesItems.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStorePower from './InMemoryLogStorePower.js'

export default class InMemoryLogStoreSubcollection<V> extends ManagesItems<RecordValue> implements SubcollectionInterface<V>  {
    collectionName: string
    name: string
    dbname: string
    databaseManager: DatabaseManager
    inMemoryLogStore: InMemoryLogStore

    powers: Map<number, InMemoryLogStorePower<V>> = new Map()

    constructor(databaseManager: DatabaseManager, inMemoryLogStore: InMemoryLogStore, dbname: string, collectionName: string, name: string){
        // TODO, log should pull paramaeters from the older log or lower layers
        super(0, new Set([]), new Set([]))

        this.dbname = dbname
        this.databaseManager = databaseManager
        this.inMemoryLogStore = inMemoryLogStore
        this.collectionName = collectionName
        this.name = name
    }
}