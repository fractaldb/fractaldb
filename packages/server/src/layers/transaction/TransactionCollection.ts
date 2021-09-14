import { CollectionManager } from '../../managers/CollectionManager.js'
import { BNodeData, IndexData, NodeData, PowerOfBNodeUnionData, PowerOfIndexData } from '../../structures/Subcollection.js'
import TransactionSubcollection from './TransactionSubcollection.js'
import { CreateNodeResponse } from '@fractaldb/shared/operations/CreateNode.js'
import Transaction from './Transaction.js'
/**
 * transaction log contains all the updates for nodes
 * a node's value needs to get updated,
 */

export default class TransactionCollection {

    name: string
    db: string
    collectionManager: CollectionManager
    tx: Transaction

    bnodes: TransactionSubcollection<BNodeData>
    powerOfBNodeData: Map<number, TransactionSubcollection<PowerOfBNodeUnionData>> = new Map()

    indexes: TransactionSubcollection<IndexData>
    powerOfIndexData: Map<number, TransactionSubcollection<PowerOfIndexData>> = new Map()

    nodes: TransactionSubcollection<NodeData>
    powerOfValuesData: Map<number, TransactionSubcollection<PowerOfBNodeUnionData>> = new Map()

    constructor(tx: Transaction, collectionManager: CollectionManager, db: string, name: string){
        this.tx = tx
        this.name = name
        this.collectionManager = collectionManager
        this.db = db

        this.bnodes = new TransactionSubcollection(this.tx, collectionManager.bnode)
        this.indexes = new TransactionSubcollection(this.tx, collectionManager.index)
        this.nodes = new TransactionSubcollection(this.tx, collectionManager.nodes)
    }

    getWrites() {
        let writes = []
        writes.push(...this.bnodes.getWrites())
        writes.push(...this.indexes.getWrites())
        writes.push(...this.nodes.getWrites())
        return writes
    }

    releaseLocks() {
        this.bnodes.releaseLocks()
        this.indexes.releaseLocks()
        this.nodes.releaseLocks()
    }

    /**
     * Create a node in the collection
     */
    async createNode(): Promise<CreateNodeResponse> {
        let id = await this.nodes.subcollectionManager.allocateID()
        let value: NodeData = [0, 0]
        await this.nodes.set(id, value)

        return {db: this.db, collection: this.name, id, properties: value[0], references: value[1]}
    }

    async createIndex(){
        let indexDataID =
        let id = await this.indexes.subcollectionManager.allocateID()
        let value: IndexData = [0, 0]
    }

    /**
     * Create a BNode in the collection, and it's power of BNode
     */
    async createBNode() {
        let id = await this.bnodes.subcollectionManager.allocateID()
        let value: BNodeData = [0, 0]
    }

    async setBNode(id: number, value: PowerOfBNodeUnionData) {
        await this.bnodes.set(id, value)
    }
}