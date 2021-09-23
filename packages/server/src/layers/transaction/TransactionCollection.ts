import { BNodeUnionData, IndexData, NodeData, ValueData } from '../../structures/Subcollection.js'
import { CreateNodeResponse } from '@fractaldb/shared/operations/CreateNode.js'
import Transaction from './Transaction.js'
import TransactionSubcollection from './TransactionSubcollection.js'
import CollectionInterface from '../../interfaces/CollectionInterface.js'
import { CollectionOpts } from '../../interfaces/Options.js'
import MockCollection from '../mock/MockCollection.js'
/**
 * transaction log contains all the updates for nodes
 * a node's value needs to get updated,
 */

export default class TransactionCollection implements CollectionInterface {
    tx: Transaction
    opts: CollectionOpts
    mock: MockCollection

    bnode: TransactionSubcollection<BNodeUnionData>
    index: TransactionSubcollection<IndexData>
    value: TransactionSubcollection<ValueData>
    node: TransactionSubcollection<NodeData>

    constructor(tx: Transaction, opts: CollectionOpts, mock: MockCollection){
        this.tx = tx
        this.opts = opts
        this.mock = mock

        this.bnode = new TransactionSubcollection(this.tx, {...opts, subcollection: 'bnode'}, mock.bnode)
        this.index = new TransactionSubcollection(this.tx, {...opts, subcollection: 'index'}, mock.index)
        this.node = new TransactionSubcollection(this.tx, {...opts, subcollection: 'node'}, mock.node)
        this.value = new TransactionSubcollection(this.tx, {...opts, subcollection: 'value'}, mock.value)
    }

    getWrites() {
        let writes = []
        writes.push(...this.bnode.getWrites())
        writes.push(...this.index.getWrites())
        writes.push(...this.node.getWrites())
        writes.push(...this.value.getWrites())
        return writes
    }

    releaseLocks() {
        this.bnode.releaseLocks()
        this.index.releaseLocks()
        this.node.releaseLocks()
    }

    /**
     * Create a node in the collection
     */
    async createNode(): Promise<CreateNodeResponse> {
        let id = await this.node.allocateID()
        let value: NodeData = [0, 0]
        await this.node.setActual(id, value)

        return {database: this.opts.database, collection: this.opts.collection, id, properties: value[0], references: value[1]}
    }

    async createIndex(){
        let bnode = await this.createBNode()
        let id = await this.index.allocateID()
        let value: IndexData = [0, 0]
    }

    /**
     * Create a BNode in the collection, and it's power of BNode
     */
    async createBNode() {
        let id = await this.bnode.allocateID()
        // let value: BNodeUnionData = [0, 0]
    }

    async setBNode(id: number, value: BNodeUnionData) {
        await this.bnode.setActual(id, value)
    }
}