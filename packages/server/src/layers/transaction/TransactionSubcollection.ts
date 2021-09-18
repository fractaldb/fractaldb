import { Commands, LogCommand } from '../../logcommands/index.js'
import { SubcollectionManager } from '../../managers/SubcollectionManager.js'
import { hasItems } from './interfaces/hasItems.js'
import Transaction from './Transaction.js'
import { RecordValue } from '../../structures/DataStructures.js'
import TransactionPower from './TransactionPower.js'
import HasItemsAbstract from './abstract/HasItemsAbstract.js'
import { getUpperPowerOf2 } from '../../utils/getUpperPower.js'
import InMemoryMockSubcollection from '../inmemory/InMemoryMockSubcollection.js'
import InMemoryLogStoreSubcollection from '../inmemory/LogStore/InMemoryLogStoreSubcollection.js'


export default class TransactionSubcollection<V> extends HasItemsAbstract<RecordValue> implements hasItems<RecordValue> {
    subcollection: InMemoryLogStoreSubcollection<V>
    tx: Transaction

    powers: Map<number, TransactionPower<V> | null> = new Map()

    constructor(tx: Transaction, subcollection: InMemoryMockSubcollection<V>) {
        super(subcollection)
        this.tx = tx
        this.subcollection = subcollection
    }

    /**
     * Helper function that returns the actual value of the id (not the power pointers)
     */
    async get(id: number): Promise<V | null> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx, this)

        // get item from subcollection state
        let recordValue = this.items.get(id)

        // not in local state, try to get from InMemory system
        if(recordValue == undefined) recordValue = await this.subcollectionManager.inMemoryLayer.get(id)

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
                this.subcollectionManager.db,
                this.subcollectionManager.collection,
                this.subcollectionManager.name,
                id,
                value
            ])
        }
        return writes
    }

    getOrCreatePower(power: number) {
        let powerClass = this.powers.get(power)
        if(!powerClass) {
            powerClass = new TransactionPower(this.tx, this.subcollectionManager.getOrCreatePowerManager(power), power)
            this.powers.set(power, powerClass)
        }
        return powerClass
    }

    async set(id: number, value: V): Promise<void> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx, this)

        let adn = this.tx.server.adn
        let serialised = adn.serialize(value)
        let power = getUpperPowerOf2(serialised.length)

        let powerClass = this.getOrCreatePower(power)

        let index = await powerClass.allocateID()
        powerClass.set(index, value)

        // set item in local state
        this.items.set(id, [power, index])
    }
}