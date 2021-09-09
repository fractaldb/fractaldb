import { Subcollection } from '../../subcollection/SubcollectionManager.js'
import { SubcollectionInterface } from '../../subcollection/SubcollectionInterface.js'

export class InMemorySubcollection implements SubcollectionInterface {
    subcollection: Subcollection

    constructor(subcollection: Subcollection) {
        this.subcollection = subcollection
    }

    async get(key: number): Promise<V | null> {
        return null
    }

    async set(key: number, value: V): Promise<void> {

    }

    async remove(key: number): Promise<void> {

    }
}