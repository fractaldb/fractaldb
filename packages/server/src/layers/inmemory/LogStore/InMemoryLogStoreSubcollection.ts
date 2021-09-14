import DatabaseManager from '../../../managers/DatabaseManager.js'
import InMemoryLogStore from './InMemoryLogStore.js'

export default class InMemoryLogStoreSubcollection<V> {
    collectionName: string
    name: string
    dbname: string
    databaseManager: DatabaseManager
    inMemoryLogStore: InMemoryLogStore

    items: Map<number, V> = new Map()


    constructor(databaseManager: DatabaseManager, inMemoryLogStore: InMemoryLogStore, dbname: string, collectionName: string, name: string){
        this.dbname = dbname
        this.databaseManager = databaseManager
        this.inMemoryLogStore = inMemoryLogStore
        this.collectionName = collectionName
        this.name = name
    }

    async get(id: number): Promise<V | null> {
        const item = this.items.get(id)

        if(item !== undefined) { // return item or null (null means item was deleted){
            return item
        } // item doesn't exist

        if(this.inMemoryLogStore.older) { // there is an older log store, so we need to check it for the same item
            let db = this.inMemoryLogStore.older.getDatabase(this.dbname)
            if(db) {
                let collection = db.getCollection(this.collectionName)
                const subcollection = (collection as any)[this.name] as InMemoryLogStoreSubcollection<V>
                if(subcollection) return subcollection.get(id)
            }
        } else { // there is no older log store, so we need to check the next database layer
            // TODO: check next database layer (LRU or DISK)
            throw new Error('Disk layer not implemented')
        }
        return null
    }
}