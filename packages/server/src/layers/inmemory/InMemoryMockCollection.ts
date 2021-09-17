import { FractalServer } from '../../database/Server.js'
import { BNodeUnionData, IndexData, NodeData, ValueData } from '../../structures/Subcollection.js'
import InMemoryMockSubcollection from './InMemoryMockSubcollection.js'


export default class InMemoryMockCollection {

    name: string
    server: FractalServer
    databaseName: string

    bnode: InMemoryMockSubcollection<BNodeUnionData>
    index: InMemoryMockSubcollection<IndexData>
    nodes: InMemoryMockSubcollection<NodeData>
    values: InMemoryMockSubcollection<ValueData>

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