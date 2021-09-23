import { FractalServer } from '../../database/Server.js'
import { CollectionOpts } from '../../interfaces/Options.js'
import { BNodeUnionData, IndexData, NodeData, ValueData } from '../../structures/Subcollection.js'
import MockSubcollection from './MockSubcollection.js'


export default class MockCollection {
    server: FractalServer
    opts: CollectionOpts

    bnode: MockSubcollection<BNodeUnionData>
    index: MockSubcollection<IndexData>
    node: MockSubcollection<NodeData>
    value: MockSubcollection<ValueData>

    constructor(server: FractalServer, opts: CollectionOpts) {
        this.server = server

        this.opts = opts

        this.bnode = new MockSubcollection(server, {...this.opts, subcollection: 'bnode'})
        this.index = new MockSubcollection(server, {...this.opts, subcollection: 'index'})
        this.node = new MockSubcollection(server, {...this.opts, subcollection: 'node'})
        this.value = new MockSubcollection(server, {...this.opts, subcollection: 'value'})
    }
}