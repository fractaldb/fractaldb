import { RecordValue } from '../../structures/DataStructures.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStorePower from './InMemoryLogStorePower.js'
import { SubcollectionOpts } from '../../interfaces/Options.js'
import ManagesLogItems from '../../interfaces/ManagesLogItems.js'
import { HasGetterItems } from '../../interfaces/HasGetterItems.js'
import MockSubcollection from '../mock/MockSubcollection.js'

export default class InMemoryLogStoreSubcollection<V> extends ManagesLogItems implements SubcollectionInterface<V>, HasGetterItems<RecordValue>{
    inMemoryLogStore: InMemoryLogStore
    opts: SubcollectionOpts
    mock: MockSubcollection<V>

    powers: Map<number, InMemoryLogStorePower<V>> = new Map()

    constructor(inMemoryLogStore: InMemoryLogStore, opts: SubcollectionOpts){
        // TODO, log should pull paramaeters from the older log or lower layers
        super()
        this.mock = inMemoryLogStore.server.mockLayer
            .getOrCreateMockDatabase(opts.database)
            .getOrCreateMockCollection(opts.collection)
            [opts.subcollection] as MockSubcollection<V>
        this.opts = opts
        this.inMemoryLogStore = inMemoryLogStore
    }

    get server () {
        return this.inMemoryLogStore.server
    }

    async get(id: number): Promise<RecordValue | null | undefined> {
        let string = this.items.get(id)
        if (string) return this.server.adn.deserialize(string) as RecordValue
        if (string === null) return null
        return undefined // doesn't exist in this layer
    }
}