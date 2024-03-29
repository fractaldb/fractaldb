import { Commands, LogCommand } from '../../logcommands/commands.js'
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
        await this.lock(id)

        let value = this.items.get(id)
        if(value) return this.server.adn.deserialize(value) as RecordValue
        // not in local state, try to get from next layers
        if(!value) return await this.mock.predicate(async layer => await layer?.get(id)) ?? null

        return null
    }

    /**
     * Helper function that returns the actual value of the id (not the power pointers)
     */
    async getActual(id: number): Promise<V | null> {
        await this.lock(id)

        let recordValue = await this.get(id)

        if(recordValue) { // the value exists
            const [power, index] = recordValue

            let value = await this.getOrCreatePower(power)
                .get(index)
            if(value) return value

            throw new Error('Tried to get power data that was deleted or does not exist')
        }

        return null // value doesn't exist or has been deleted
    }

    async getWrites(): Promise<LogCommand[]> {
        let writes: LogCommand[] = []
        for (let [id, value] of this.items) {
            writes.push([
                Commands.SetSubcollectionData,
                this.opts.database,
                this.opts.collection,
                this.opts.subcollection,
                id,
                value ? this.server.adn.deserialize(value) : null
            ])
        }

        for(let power of this.powers.values()) {
            writes.push(...await power.getWrites())
        }

        return writes
    }

    releaseUsedIDs() {
        for(let power of this.powers.values()) {
            power.releaseUsedIDs()
        }
        super.releaseUsedIDs()
    }

    releaseLocks() {
        for (let power of this.powers.values()) {
            power.releaseLocks()
        }
        super.releaseLocks()
    }

    getOrCreatePower(power: number) {
        let powerClass = this.powers.get(power)
        if(!powerClass) {
            powerClass = new TransactionPower(this.tx, {...this.opts, power }, this.mock.getOrCreateMockPower(power))
            this.powers.set(power, powerClass)
        }
        return powerClass
    }

    async setActual(id: number, value: V | null): Promise<void> {
        await this.lock(id)

        // TODO, check if the id is already in the subcollection, if so, we delete the old power of ID, and create a new one
        let adn = this.tx.server.adn
        let serialised = adn.serialize(value)
        let power = getUpperPowerOf2(serialised.length)


        let powerClass = this.getOrCreatePower(power)

        let index = await powerClass.allocateID()
        await powerClass.set(index, value)

        let recordValue: RecordValue = [power, index]

        // set item in local state
        this.items.set(id, this.server.adn.serialize(recordValue))
    }

    async lock(id: number){
        let resource = [this.opts.database, this.opts.collection, this.opts.subcollection, id].join('.')
        await this.tx.server.lockEngine.tryToAcquireLock(resource, this.tx, this)
    }

    /**
     * Set the recordValue of a node with the given ID
     *
     * Pass in null as the value to delete the node
     */
    async set(id: number, value: RecordValue | null) {
        await this.lock(id)

        this.items.set(id, value ? this.server.adn.serialize(value) : null)
    }

    async allocateID(): Promise<number> {
        let id = await super.allocateID()
        await this.lock(id)
        return id
    }
}