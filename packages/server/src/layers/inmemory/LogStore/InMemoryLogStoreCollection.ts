import DatabaseManager from '../../../managers/DatabaseManager.js'
import { BNodeUnionData, IndexData, NodeData, ValueData } from '../../../structures/Subcollection.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreSubcollection from './InMemoryLogStoreSubcollection.js'

export default class InMemoryLogStoreCollection {
    dbname: string
    name: string

    bnode: InMemoryLogStoreSubcollection<BNodeUnionData>
    index: InMemoryLogStoreSubcollection<IndexData>
    nodes: InMemoryLogStoreSubcollection<NodeData>
    values: InMemoryLogStoreSubcollection<ValueData>

    constructor(database: DatabaseManager, inMemoryLogStore: InMemoryLogStore, dbname: string, name: string) {
        this.dbname = dbname
        this.name = name

        this.bnode = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'bnode')
        this.index = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'index')
        this.nodes = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'node')
        this.values = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'value')
    }
}