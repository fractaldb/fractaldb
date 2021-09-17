
import { FractalServer } from '../database/Server.js'
import InMemoryMockCollection from '../layers/inmemory/InMemoryMockCollection.js'
import InMemoryMockDatabase from '../layers/inmemory/InMemoryMockDatabase.js'
import { BNodeUnionData, IndexData, NodeData, ValueData } from '../structures/Subcollection.js'
import { SubcollectionManager } from './SubcollectionManager.js'

export class CollectionManager {
    name: string
    dbname: string
    server: FractalServer
    inMemoryLayer: InMemoryMockCollection

    bnode: SubcollectionManager<BNodeUnionData>
    index: SubcollectionManager<IndexData>
    nodes: SubcollectionManager<NodeData>
    values: SubcollectionManager<ValueData>

    constructor(server: FractalServer, inMemoryLayer: InMemoryMockDatabase, dbname: string, name: string) {
        this.dbname = dbname
        this.name = name
        this.server = server
        this.inMemoryLayer = inMemoryLayer.getOrCreateMockCollection(name)

        this.bnode = new SubcollectionManager(server, this.inMemoryLayer.bnode, dbname, name, 'bnode')
        this.index = new SubcollectionManager(server, this.inMemoryLayer.index, dbname, name, 'index')
        this.nodes = new SubcollectionManager(server, this.inMemoryLayer.nodes, dbname, name, 'nodes')
        this.values = new SubcollectionManager(server, this.inMemoryLayer.values, dbname, name, 'values')
    }
}