import { Commands, LogCommand } from '../../logcommands/index.js'
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
        let resource = [this.opts.database, this.opts.collection, this.opts.subcollection, id].join('.')
        await this.tx.server.lockEngine.tryToAcquireLock(resource, this.tx, this)

        let value = this.items.get(id)
        if(value) return this.server.adn.deserialize(value) as V
        // not in local state, try to get from next layers
        if(!value) return await this.mock.predicate(layer => layer?.get(id)) ?? null

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
                value
            ])
        }
        return writes
    }

    async set(index: number, value: V){
        this.items.set(index, this.server.adn.serialize(value))
    }
}