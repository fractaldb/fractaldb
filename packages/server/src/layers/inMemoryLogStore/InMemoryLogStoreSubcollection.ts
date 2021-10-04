import { RecordValue } from '../../structures/DataStructures.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import ManagesIDAllocation from '../../interfaces/ManagesIDAllocation.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import InMemoryLogStorePower from './InMemoryLogStorePower.js'
import HasIDsInterface from '../../interfaces/HasIDsInterface.js'
import { SubcollectionOpts } from '../../interfaces/Options.js'

export default class InMemoryLogStoreSubcollection<V> extends ManagesIDAllocation implements SubcollectionInterface<V>, HasIDsInterface<RecordValue> {
    inMemoryLogStore: InMemoryLogStore
    opts: SubcollectionOpts

    initialised: boolean
    powers: Map<number, InMemoryLogStorePower<V>> = new Map()

    constructor(inMemoryLogStore: InMemoryLogStore, opts: SubcollectionOpts){
        // TODO, log should pull paramaeters from the older log or lower layers
        super()
        this.opts = opts
        this.inMemoryLogStore = inMemoryLogStore
        this.initialised = false
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