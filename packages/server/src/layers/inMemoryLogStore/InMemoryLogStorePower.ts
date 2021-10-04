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
        super()
        this.opts = opts
        this.inMemoryLogStore = inMemoryLogStore
        this.initialised = false
    }

    get server () {
        return this.inMemoryLogStore.server
    }

    async get(id: number): Promise<V | null | undefined> {
        let string = this.items.get(id)
        if (string) return this.server.adn.deserialize(string) as V
        if (string === null) return null
        return undefined // doesn't exist in this layer
    }
}