import { FractalServer } from '../../database/Server.js'
import { CollectionOpts } from '../../interfaces/Options.js'
import { BNodeUnionData, IndexDataUnion, NodeData, ValueData } from '../../structures/Subcollection.js'
import MockSubcollection, { SubcollectionInfo } from './MockSubcollection.js'

export type CollectionInfo = {
    bnode: SubcollectionInfo
    index: SubcollectionInfo
    node: SubcollectionInfo
    value: SubcollectionInfo
}

export default class MockCollection {
    server: FractalServer
    opts: CollectionOpts
    rootIndexes: Set<number> = new Set()

    bnode: MockSubcollection<BNodeUnionData<any>>
    index: MockSubcollection<IndexDataUnion>
    node: MockSubcollection<NodeData>
    value: MockSubcollection<ValueData>

    constructor(server: FractalServer, opts: CollectionOpts, collectionInfo: CollectionInfo) {
        this.server = server

        this.opts = opts

        this.bnode = new MockSubcollection(server, {...this.opts, subcollection: 'bnode'}, collectionInfo.bnode)
        this.index = new MockSubcollection(server, {...this.opts, subcollection: 'index'}, collectionInfo.index)
        this.node = new MockSubcollection(server, {...this.opts, subcollection: 'node'}, collectionInfo.node)
        this.value = new MockSubcollection(server, {...this.opts, subcollection: 'value'}, collectionInfo.value)
    }
}