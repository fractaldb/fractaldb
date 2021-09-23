import { Commands, LogCommand } from '../../logcommands/index.js'
import { hasItems } from './interfaces/hasItems.js'
import Transaction from './Transaction.js'
import { RecordValue } from '../../structures/DataStructures.js'
import TransactionPower from './TransactionPower.js'
import HasItemsAbstract from './abstract/HasItemsAbstract.js'
import { getUpperPowerOf2 } from '../../utils/getUpperPower.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import { SubcollectionOpts } from '../../interfaces/Options.js'
import MockSubcollection from '../mock/MockSubcollection.js'

export default class TransactionSubcollection<V> extends HasItemsAbstract implements hasItems, SubcollectionInterface<V> {
    tx: Transaction
    opts: SubcollectionOpts
    mock: MockSubcollection<V>

    powers: Map<number, TransactionPower<V>> = new Map()

    constructor(tx: Transaction, opts: SubcollectionOpts, mock: MockSubcollection<V>) {
        super(mock)
        this.tx = tx
        this.opts = opts
        this.mock = mock
    }

    get server () {
        return this.tx.server
    }

    /**
     * Get the record value for the given ID, if it does not exist, then a lower layer will be queried
     */
    async get(id: number): Promise<RecordValue | null> {
        let resource = [this.opts.database, this.opts.collection, this.opts.subcollection, id].join('.')
        await this.tx.server.lockEngine.tryToAcquireLock(resource, this.tx, this)

        let value = this.items.get(id)
        if(value) return this.server.adn.deserialize(value) as RecordValue
        // not in local state, try to get from next layers
        if(!value) return await this.mock.predicate(layer => layer?.get(id)) ?? null

        return null
    }

    /**
     * Helper function that returns the actual value of the id (not the power pointers)
     */
    async getActual(id: number): Promise<V | null> {
        let recordValue = await this.get(id)

        if(recordValue) { // the value exists
            const [power, index] = recordValue

            let value = this.powers.get(power)
                ?.get(index)

            if(value) return value

            throw new Error('Tried to get a powerValues that was deleted or does not exist')
        }

        return null // value doesn't exist or has been deleted
    }

    getWrites(): LogCommand[] {
        let writes: LogCommand[] = []
        for (let [id, value] of this.items) {
            writes.push([
                Commands.SetSubcollectionData,
                this.opts.database,
                this.opts.collection,
                this.opts.subcollection,
                id,
                value
            ])
        }
        return writes
    }

    getOrCreatePower(power: number) {
        let powerClass = this.powers.get(power)
        if(!powerClass) {
            powerClass = new TransactionPower(this.tx, {...this.opts, power }, this.mock.getOrCreateMockPower(power))
            this.powers.set(power, powerClass)
        }
        return powerClass
    }

    async setActual(id: number, value: V): Promise<void> {
        let resource = [this.opts.database, this.opts.collection, this.opts.subcollection, id].join('.')
        await this.tx.server.lockEngine.tryToAcquireLock(resource, this.tx, this)

        // TODO, check if the id is already in the subcollection, if so, we delete the old power of ID, and create a new one
        let adn = this.tx.server.adn
        let serialised = adn.serialize(value)
        let power = getUpperPowerOf2(serialised.length)

        let powerClass = this.getOrCreatePower(power)

        let index = await powerClass.allocateID()
        powerClass.set(index, value)

        let recordValue: RecordValue = [power, index]

        // set item in local state
        this.items.set(id, this.server.adn.serialize(recordValue))
    }
}