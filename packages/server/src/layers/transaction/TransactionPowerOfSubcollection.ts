import { Commands, LogCommand } from '../../logcommands'
import { SubcollectionManager } from '../../managers/SubcollectionManager'
import Transaction from './Transaction'
import TransactionSubcollection from './TransactionSubcollection'


export default class TransactionSubcollectionValues<V> extends TransactionSubcollection<V> {

    power: number

    constructor(tx: Transaction, subcollectionManager: SubcollectionManager<V>, power: number) {
        super(tx, subcollectionManager)
        this.power = power
    }

    getWrites(): LogCommand[] {
        let writes: LogCommand[] = []
        for (let [id, value] of this.items) {
            writes.push([
                Commands.SetPowerOfData,
                this.subcollectionManager.db,
                this.subcollectionManager.collection,
                this.subcollectionManager.name,
                this.power,
                id,
                value
            ])
        }
        return writes
    }
}