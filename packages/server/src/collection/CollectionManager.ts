
import { Transaction } from '../layers/transaction/Transaction.js'
import { SubcollectionManager } from '../subcollection/SubcollectionManager.js'

export class CollectionManager {
    name: string

    docs: SubcollectionManager
    indexes: SubcollectionManager
    bnodes: SubcollectionManager

    constructor(name: string) {
        this.name = name
        this.docs = new SubcollectionManager(this, 'docs')
        this.indexes = new SubcollectionManager(this, 'indexes')
        this.bnodes = new SubcollectionManager(this, 'bnodes')
    }
}