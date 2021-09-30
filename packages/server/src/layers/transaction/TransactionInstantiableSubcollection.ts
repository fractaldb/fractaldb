import { SubcollectionOpts } from '../../interfaces/Options'
import { LogCommand } from '../../logcommands/commands'
import MockSubcollection from '../mock/MockSubcollection'
import Transaction from './Transaction'
import TransactionSubcollection from './TransactionSubcollection'

type Instantiator<I, V> = (id: number, data: V) => I

export interface Deinstantiator<V> {
    deinstantiate: () => V
}

export class TransactionInstantiableSubcollection<I extends Deinstantiator<V>, V> extends TransactionSubcollection<V> {
    instances: Map<number, I> = new Map()
    modified: Set<number> = new Set()
    instantiator: Instantiator<I, V>

    constructor(tx: Transaction, opts: SubcollectionOpts, mock: MockSubcollection<V>, instantiator: Instantiator<I, V>) {
        super(tx, opts, mock)
        this.instantiator = instantiator
    }

    async setAsModified(id: number) {
        await this.lock(id)
        this.modified.add(id)
    }

    async getOrInstantiate(id: number): Promise<I | null> {
        let instance = this.instances.get(id)
        if (!instance) {
            let item = await this.getActual(id)
            if (item) {
                instance = await this.instantiator(id, item)
                this.instances.set(id, instance)
            }
            return null
        }
        return instance
    }

    async setInstance(id: number, instance: I) {
        await this.lock(id)
        this.modified.add(id)
        this.instances.set(id, instance)
    }

    getWrites(): LogCommand[] {
        for(let id of this.modified) {
            this.setActual(id, this.instances.get(id)!.deinstantiate())
        }
        return super.getWrites()
    }
}