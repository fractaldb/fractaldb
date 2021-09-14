
import { FractalServer } from '../database/Server.js'
import { BNodeData, BNodePowerUnion, IndexData, IndexPowerData, NodeData, ValuePowerData } from '../structures/Subcollection.js'
import { SubcollectionManager } from './SubcollectionManager.js'

export class CollectionManager {
    name: string
    dbname: string
    server: FractalServer

    bnode: SubcollectionManager<BNodeData>
    bnodePower: Map<number, SubcollectionManager<BNodePowerUnion>>

    index: SubcollectionManager<IndexData>
    indexPower: Map<number, SubcollectionManager<IndexPowerData>>

    nodes: SubcollectionManager<NodeData>
    values: SubcollectionManager<ValuePowerData>

    constructor(server: FractalServer, dbname: string, name: string) {
        this.dbname = dbname
        this.name = name
        this.server = server

        this.bnode = new SubcollectionManager(server, dbname, name, 'bnode')
        this.bnodePower = new Map()

        this.index = new SubcollectionManager(server, dbname, name, 'index')
        this.indexPower = new Map()

        this.nodes = new SubcollectionManager(server, dbname, name, 'nodes')
        this.values = new SubcollectionManager(server, dbname, name, 'values')
    }
}