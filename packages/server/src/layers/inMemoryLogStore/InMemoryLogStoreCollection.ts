import CollectionInterface from '../../interfaces/CollectionInterface.js'
import { CollectionOpts } from '../../interfaces/Options.js'
import { BNodeUnionData, IndexDataUnion, NodeData, ValueData } from '../../structures/Subcollection.js'
import MockCollection from '../mock/MockCollection.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreSubcollection from './InMemoryLogStoreSubcollection.js'
export default class InMemoryLogStoreCollection implements CollectionInterface {
    opts: CollectionOpts
    mock: MockCollection
    addedRootIndexes: Set<number> = new Set()
    removedRootIndexes: Set<number> = new Set()

    bnode: InMemoryLogStoreSubcollection<BNodeUnionData<any>>
    index: InMemoryLogStoreSubcollection<IndexDataUnion>
    node: InMemoryLogStoreSubcollection<NodeData>
    value: InMemoryLogStoreSubcollection<ValueData>

    constructor(inMemoryLogStore: InMemoryLogStore, opts: CollectionOpts) {
        this.opts = opts
        this.mock = inMemoryLogStore.server.mockLayer
            .getOrCreateMockDatabase(opts.database)
            .getOrCreateMockCollection(opts.collection)

        this.bnode = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection: 'bnode' })
        this.index = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection:'index' })
        this.node = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection: 'node' })
        this.value = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection: 'value' })
    }
}