import { FractalServer } from '../../database/Server.js'
import { BNodeData, BNodePowerUnion, IndexData, IndexPowerData, NodeData, ValuePowerData } from '../../structures/Subcollection.js'
import InMemoryLayer from './InMemoryLayer.js'
import InMemoryMockDatabase from './InMemoryMockDatabase.js'
import InMemoryMockSubcollection from './InMemoryMockSubcollection.js'


export default class InMemoryMockCollection {

    name: string
    server: FractalServer
    databaseName: string

    bnode: InMemoryMockSubcollection<BNodeData>
    bnodePower: Map<number, InMemoryMockSubcollection<BNodePowerUnion>> = new Map()

    index: InMemoryMockSubcollection<IndexData>
    indexPower: Map<number, InMemoryMockSubcollection<IndexPowerData>> = new Map()

    nodes: InMemoryMockSubcollection<NodeData>
    values: InMemoryMockSubcollection<ValuePowerData>

    constructor(server: FractalServer, databaseName: string, name: string) {
        this.server = server
        this.name = name
        this.databaseName = databaseName

        this.bnode = new InMemoryMockSubcollection(server, databaseName, name, 'bnode')
        this.index = new InMemoryMockSubcollection(server, databaseName, name, 'index')
        this.nodes = new InMemoryMockSubcollection(server, databaseName, name, 'nodes')
        this.values = new InMemoryMockSubcollection(server, databaseName, name, 'values')
    }
}