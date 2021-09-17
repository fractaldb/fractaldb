import { Commands, LogCommand } from '../../logcommands/index.js'
import Transaction from './Transaction.js'
import { hasItems } from './interfaces/hasItems.js'
import PowerManager from '../../managers/PowerManger.js'
import HasItemsAbstract from './abstract/HasItemsAbstract.js'


export default class TransactionPower<V> extends HasItemsAbstract<V> implements hasItems<V> {

    tx: Transaction
    power: number
    powerManager: PowerManager<V>

    constructor(tx: Transaction, powerManager: PowerManager<V>, power: number) {
        super(powerManager)
        this.tx = tx
        this.power = power
        this.powerManager = powerManager
    }

    async get(index: number): Promise<V|null> {
        await this.powerManager.tryToAcquireLock(index, this.tx, this)

        // get item from subcollection state
        let value = this.items.get(index)

        // not in local state, try to get from InMemory system
        if(value == undefined) value = await this.powerManager.inMemoryLayer.get(index)
        if(typeof value === 'string') return this.powerManager.server.adn.deserialize(value)
        return value
    }

    getWrites(): LogCommand[] {
        let writes: LogCommand[] = []
        for (let [id, value] of this.items) {
            writes.push([
                Commands.SetPowerOfData,
                this.powerManager.db,
                this.powerManager.collection,
                this.powerManager.subcollection,
                this.power,
                id,
                value
            ])
        }
        return writes
    }

    async set(index: number, value: V){
        this.items.set(index, value)
    }
}