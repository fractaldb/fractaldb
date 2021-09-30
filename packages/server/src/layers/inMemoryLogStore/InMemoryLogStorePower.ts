import HasIDsInterface from '../../interfaces/HasIDsInterface.js'
import { PowerOpts } from '../../interfaces/Options.js'
import PowerInterface from '../../interfaces/PowerInterface.js'
import ManagesIDAllocation from '../../interfaces/ManagesIDAllocation.js'
import InMemoryLogStore from './InMemoryLogStore.js'

export default class InMemoryLogStorePower<V> extends ManagesIDAllocation implements HasIDsInterface<V>, PowerInterface<V> {
    opts: PowerOpts

    initialised: boolean
    inMemoryLogStore: InMemoryLogStore

    constructor(inMemoryLogStore: InMemoryLogStore, opts: PowerOpts){
        // TODO, log should pull paramaeters from the older log or lower layers
        super()
        this.opts = opts
        this.inMemoryLogStore = inMemoryLogStore
        this.initialised = false
    }

    get server () {
        return this.inMemoryLogStore.server
    }

    async get(id: number): Promise<V | null> {
        let string = this.items.get(id)
        if (string) return this.server.adn.deserialize(string) as V
        return null
    }
}