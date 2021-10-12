import { PowerOpts } from '../../interfaces/Options.js'
import PowerInterface from '../../interfaces/PowerInterface.js'
import InMemoryLogStore from './InMemoryLogStore.js'
import ManagesLogItems from '../../interfaces/ManagesLogItems.js'
import { HasGetterItems } from '../../interfaces/HasGetterItems.js'
import MockSubcollection from '../mock/MockSubcollection.js'
import MockPower from '../mock/MockPower.js'

export default class InMemoryLogStorePower<V> extends ManagesLogItems implements HasGetterItems<V>, PowerInterface<V> {
    opts: PowerOpts
    mock: MockPower<V>

    inMemoryLogStore: InMemoryLogStore

    constructor(inMemoryLogStore: InMemoryLogStore, opts: PowerOpts){
        super()
        this.mock = inMemoryLogStore.server.mockLayer
            .getOrCreateMockDatabase(opts.database)
            .getOrCreateMockCollection(opts.collection)
            [opts.subcollection]
            .getOrCreateMockPower(opts.power) as MockPower<V>

        this.opts = opts
        this.inMemoryLogStore = inMemoryLogStore
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