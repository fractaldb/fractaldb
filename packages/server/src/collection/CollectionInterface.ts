import { BNode, BNodeInternal } from '@fractaldb/indexing-system/BTreeNode'
import { SubcollectionStateInterface } from '../subcollection/SubcollectionInterface.js'
import { CollectionManager } from './CollectionManager.js'

/**
 * Collection State Interface
 *
 * This interface contains the base methods and properties for a collection state.
 *
 * Used by TransactionCollectionState, InMemoryCollectionState, LRUCollectionState, and DiskCollectionState.
 */
export interface CollectionStateInterface {
    /**
     * Meta data for the collection.
     */
    collection: CollectionManager

    docs: SubcollectionStateInterface
    indexes: SubcollectionStateInterface<any>
    bnodes: SubcollectionStateInterface<BNodeInternal<any, number> | BNode<any, number>> // TODO: switch "any" types to actual values
}