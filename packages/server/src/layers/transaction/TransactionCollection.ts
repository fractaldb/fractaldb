import { BNodeUnionData, IndexData, NodeData, ValueData } from '../../structures/Subcollection.js'
import { CreateNodeResponse } from '@fractaldb/shared/operations/CreateNode.js'
import Transaction from './Transaction.js'
import TransactionSubcollection from './TransactionSubcollection.js'
import InMemoryMockCollection from '../inmemory/InMemoryMockCollection.js'
/**
 * transaction log contains all the updates for nodes
 * a node's value needs to get updated,
 */

export default class TransactionCollection {

    name: string
    db: string
    collection: InMemoryMockCollection
    tx: Transaction

    bnodes: TransactionSubcollection<BNodeUnionData>
    indexes: TransactionSubcollection<IndexData>
    values: TransactionSubcollection<ValueData>
    nodes: TransactionSubcollection<NodeData>

    constructor(tx: Transaction, collection: InMemoryMockCollection, db: string, name: string){
        this.tx = tx
        this.name = name
        this.collection = collection
        this.db = db

        this.bnodes = new TransactionSubcollection(this.tx, collection.bnode)
        this.indexes = new TransactionSubcollection(this.tx, collection.index)
        this.nodes = new TransactionSubcollection(this.tx, collection.nodes)
        this.values = new TransactionSubcollection(this.tx, collection.values)
    }

    getWrites() {
        let writes = []
        writes.push(...this.bnodes.getWrites())
        writes.push(...this.indexes.getWrites())
        writes.push(...this.nodes.getWrites())
        writes.push(...this.values.getWrites())
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
        let id = await this.nodes.allocateID()
        let value: NodeData = [0, 0]
        await this.nodes.set(id, value)

        return {db: this.db, collection: this.name, id, properties: value[0], references: value[1]}
    }

    async createIndex(){
        let bnode = await this.createBNode()
        let id = await this.indexes.allocateID()
        let value: IndexData = [0, 0]
    }

    /**
     * Create a BNode in the collection, and it's power of BNode
     */
    async createBNode() {
        let id = await this.bnodes.allocateID()
        // let value: BNodeUnionData = [0, 0]
    }

    async setBNode(id: number, value: BNodeUnionData) {
        await this.bnodes.set(id, value)
    }
}