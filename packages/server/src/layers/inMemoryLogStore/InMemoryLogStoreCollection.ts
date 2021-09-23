import CollectionInterface from '../../interfaces/CollectionInterface.js'
import { CollectionOpts } from '../../interfaces/Options.js'
import { BNodeUnionData, IndexData, NodeData, ValueData } from '../../structures/Subcollection.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStoreSubcollection from './InMemoryLogStoreSubcollection.js'
export default class InMemoryLogStoreCollection implements CollectionInterface {
    opts: CollectionOpts

    bnode: InMemoryLogStoreSubcollection<BNodeUnionData>
    index: InMemoryLogStoreSubcollection<IndexData>
    node: InMemoryLogStoreSubcollection<NodeData>
    value: InMemoryLogStoreSubcollection<ValueData>

    constructor(inMemoryLogStore: InMemoryLogStore, opts: CollectionOpts) {
        this.opts = opts

        this.bnode = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection: 'bnode' })
        this.index = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection:'index' })
        this.node = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection: 'node' })
        this.value = new InMemoryLogStoreSubcollection(inMemoryLogStore, { ...this.opts, subcollection: 'value' })
    }
}