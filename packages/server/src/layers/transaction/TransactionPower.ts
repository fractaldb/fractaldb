import { Commands, LogCommand, SetPowerOfData } from '../../logcommands/commands.js'
import Transaction from './Transaction.js'
import { hasItems } from './interfaces/hasItems.js'
import HasItemsAbstract from './abstract/HasItemsAbstract.js'
import PowerInterface from '../../interfaces/PowerInterface.js'
import { PowerOpts } from '../../interfaces/Options.js'
import MockPower from '../mock/MockPower.js'
export default class TransactionPower<V> extends HasItemsAbstract implements hasItems, PowerInterface<V> {

    tx: Transaction
    opts: PowerOpts
    mock: MockPower<V>

    constructor(tx: Transaction, opts: PowerOpts, mock: MockPower<V>) {
        super(mock)
        this.tx = tx
        this.opts = opts
        this.mock = mock
    }

    get server () {
        return this.tx.server
    }

    async get(id: number): Promise<V | null> {
        await this.lock(id)

        let value = this.items.get(id)
        if(value) return this.server.adn.deserialize(value) as V
        // not in local state, try to get from next layers
        if(!value) return await this.mock.predicate(async layer => await layer?.get(id)) ?? null

        return null
    }

    getWrites(): LogCommand[] {
        let writes: LogCommand[] = []
        for (let [id, value] of this.items) {
            writes.push([
                Commands.SetPowerOfData,
                this.opts.database,
                this.opts.collection,
                this.opts.subcollection,
                this.opts.power,
                id,
                value ? this.server.adn.deserialize(value) : null
            ] as SetPowerOfData)
        }
        return writes
    }

    async allocateID(): Promise<number> {
        let id = await super.allocateID()
        await this.lock(id)
        return id
    }

    async lock(id: number){
        let resource = [this.opts.database, this.opts.collection, this.opts.subcollection, this.opts.power, id].join('.')
        await this.tx.server.lockEngine.tryToAcquireLock(resource, this.tx, this)
    }

    /**
     * Set the value of a power store with the given ID
     *
     * Pass in null as the value to delete the node
     */
    async set(id: number, value: V | null){
        await this.lock(id)

        this.items.set(id, value ? this.server.adn.serialize(value) : null)
    }
}