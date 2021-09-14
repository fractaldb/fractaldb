import DatabaseManager from '../../../managers/DatabaseManager.js'
import { BNodeData, BNodePowerUnion, IndexData, IndexPowerData, NodeData, ValuePowerData } from '../../../structures/Subcollection.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreSubcollection from './InMemoryLogStoreSubcollection.js'

export default class InMemoryLogStoreCollection {
    dbname: string
    name: string

    bnode: InMemoryLogStoreSubcollection<BNodeData>
    bnodePower: Map<number, InMemoryLogStoreSubcollection<BNodePowerUnion>> = new Map()

    index: InMemoryLogStoreSubcollection<IndexData>
    indexPower: Map<number, InMemoryLogStoreSubcollection<IndexPowerData>> = new Map()

    nodes: InMemoryLogStoreSubcollection<NodeData>
    values: InMemoryLogStoreSubcollection<ValuePowerData>

    constructor(database: DatabaseManager, inMemoryLogStore: InMemoryLogStore, dbname: string, name: string) {
        this.dbname = dbname
        this.name = name
        this.bnode = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'bnode')
        this.index = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'index')
        this.nodes = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'node')
        this.values = new InMemoryLogStoreSubcollection(database, inMemoryLogStore, this.dbname, name, 'value')
    }
}