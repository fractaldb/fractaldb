import { BNode, BNodeInternal } from '@fractaldb/indexing-system/BTreeNode.js'
import { SubcollectionManager } from '../../../subcollection/SubcollectionManager.js'
import { SerializableInterface } from '../interfaces/SerializableInterface.js'
import { SubcollectionInterface } from '../interfaces/SubcollectionInterface.js'
import { TransactionCollection} from '../TransactionCollection.js'

enum BNodeType {
    LEAF = 0,
    INTERNAL = 1
}

type LeafNodeData<K, V> = [keys: K[], values?: V[]]
type InternalNodeData<K> = [children: number[], keys: K[]]

export class BNodeSubcollection<K, V> implements SerializableInterface, SubcollectionInterface {

    /**
     * private variable that stores the cached BNode objects in a Map
     */
    private bnodes: Map<number, any> = new Map<number, any>()
    private modified: Set<number> = new Set()
    private subcollectionManager: SubcollectionManager
    private collectionState: TransactionCollection

    private freeIds: Set<number> = new Set()
    private assignedIds: Set<number> = new Set()

    constructor(collectionState: TransactionCollection, subcollectionManager: SubcollectionManager) {
        this.subcollectionManager = subcollectionManager
        this.collectionState = collectionState
    }

    private get tx () {
        return this.collectionState.txState.tx
    }

    /** Get an instantiated BNode with the following ID
     *
     * If there is a cached, instantiated BNode
     * - return that
     * If there is no cached BNode
     *  - searches inMemory DB for ADN string
     *  - if not found, throw error
     *  - deserialises it
     *  - instantiates a new BNode with the deserialised ADN
     *  - caches the BNode
     *  - returns the BNode
     */
    async get (id: number): Promise<BNode<K, V>> {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx)
        if (this.bnodes.has(id)) {
            return this.bnodes.get(id);
        } else {
            let adn = await this.subcollectionManager.inMemory.get(id)
            if (!adn) throw new Error(`No BNode found for id ${id}`)
            let deserialized = await this.tx.database.server.adn.deserialize(adn)
            switch (deserialized[0] as BNodeType) {
                case BNodeType.LEAF: {
                    let bnode = new BNode<K, V>(this.collectionState, id, ...deserialized[1] as LeafNodeData<K, V>)
                    this.bnodes.set(id, bnode)
                    return bnode
                }
                case BNodeType.INTERNAL: {
                    let bnode = new BNodeInternal<K, V>(this.collectionState, id, ...deserialized[1] as InternalNodeData<K>)
                    this.bnodes.set(id, bnode)
                    return bnode
                }
            }
        }
    }

    /**
     * Set the the value of the node with the given id
     */
    async set(id: number, value: any) {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx)
        this.modified.add(id)
        this.bnodes.set(id, value)
    }

    /**
     * Set the node with the given id as modified
     */
    async setAsModified(id: number) {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx)
        this.modified.add(id)
    }

    /**
     * Delete the node with the given id
     */
    async remove(id: number) {
        await this.subcollectionManager.tryToAcquireLock(id, this.tx)
        this.modified.add(id)
        this.bnodes.set(id, null)
        this.freeIds.add(id)
    }

    async allocateID(): Promise<number> {
        // check if there are any free IDs available in this subcollection, and return the first one
        if (this.freeIds.size > 0) {
            let id = this.freeIds.values().next().value
            this.freeIds.delete(id)
            await this.subcollectionManager.tryToAcquireLock(id, this.tx)
            return id
        }
        // if not, then get the subcollection to allocate a new ID to this transaction/subcollection
        let id = await this.subcollectionManager.getID()
        this.assignedIds.add(id)
        return id
    }
}