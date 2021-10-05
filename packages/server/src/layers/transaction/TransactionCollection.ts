import { BNodeInternalData, BNodeLeafData, BNodeTypes, BNodeUnionData, IndexDataUnion, IndexTypes, NodeData, PropertyIndexData, PropertyMapData, UniqueIndexData, PropertyMapValue, ValueData, ValueTypes } from '../../structures/Subcollection.js'
import { CreateNodeResponse } from '@fractaldb/shared/operations/CreateNode.js'
import Transaction from './Transaction.js'
import TransactionSubcollection from './TransactionSubcollection.js'
import CollectionInterface, { RootIndex } from '../../interfaces/CollectionInterface.js'
import { CollectionOpts } from '../../interfaces/Options.js'
import MockCollection from '../mock/MockCollection.js'
import { Deinstantiator, TransactionInstantiableSubcollection } from './TransactionInstantiableSubcollection.js'
import { BNode, BNodeInternal } from '@fractaldb/indexing-system/BTreeNode.js'
import BTree from '@fractaldb/indexing-system/BTree.js'
import { PropertyMap } from '@fractaldb/indexing-system/indexes/PropertyMap.js'
import { PropertyBTree } from '@fractaldb/indexing-system/indexes/PropertyBTree.js'
import { UniqueBTree } from '@fractaldb/indexing-system/indexes/UniqueBTree.js'
import { DeleteNodeResponse } from '@fractaldb/shared/operations/DeleteNode.js'
/**
 * transaction log contains all the updates for nodes
 * a node's value needs to get updated,
 */

type BaseIndex = {
    id: number
    root: number
}

type PropertyMapIndex = {
    type: IndexTypes.propertyMap
    node: number
} & BaseIndex

type BNodeResponseData = {
    database: string
    collection: string
    id: number
    type: BNodeTypes
    data: BNodeInternalData | BNodeLeafData<any>
}

type NodeStruct = {
    id: number
    properties: number
    references: number
}
export default class TransactionCollection implements CollectionInterface {
    tx: Transaction
    opts: CollectionOpts
    mock: MockCollection
    rootIndexes: number[] = [] // ids of RootIndexes

    bnode: TransactionInstantiableSubcollection<BNode<any, any>, BNodeUnionData<any>>
    index: TransactionInstantiableSubcollection<BTree<any, any> & Deinstantiator<IndexDataUnion>, IndexDataUnion>
    value: TransactionSubcollection<ValueData>
    node: TransactionSubcollection<NodeData>

    constructor(tx: Transaction, opts: CollectionOpts, mock: MockCollection){
        this.tx = tx
        this.opts = opts
        this.mock = mock

        this.bnode = new TransactionInstantiableSubcollection(this.tx, {...opts, subcollection: 'bnode'}, mock.bnode, (id: number, data: BNodeUnionData<any>) => {
            let type = data[0]
            switch(type) {
                case BNodeTypes.Leaf:
                    return new BNode(this, id, data[1], data[2] as BNodeLeafData<any>[2])
                case BNodeTypes.Internal:
                    return new BNodeInternal(this, id, data[1], data[2] as BNodeInternalData[2])
            }
        })
        this.index = new TransactionInstantiableSubcollection(this.tx, {...opts, subcollection: 'index'}, mock.index, (id: number, data: IndexDataUnion) => {
            let type = data[0]
            switch(type) {
                case IndexTypes.propertyMap: {
                    let [type, root, node, size] = data as PropertyMapData
                    return new PropertyMap(this, id, root, node, size)
                }
                case IndexTypes.property: {
                    let [type, propertyPath, root, size, uniquePath] = data as PropertyIndexData
                    return new PropertyBTree(this, id, propertyPath, root, uniquePath ?? [], size)
                }
                case IndexTypes.unique: {
                    let [type, root, size, uniquePath, subindexes] = data as UniqueIndexData
                    return new UniqueBTree(this, id, uniquePath ?? [], root, size, subindexes ?? [])
                }
            }
        })
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

    releaseResources() {
        this.releaseLocks()
    }

    releaseLocks() {
        this.bnode.releaseLocks()
        this.index.releaseLocks()
        this.node.releaseLocks()
        this.value.releaseLocks()
    }

    /**
     * Create a node in the collection
     *
     * This will create an empty propertyindex for the node, and a reference index.
     */
    async createNode(): Promise<CreateNodeResponse> {
        let id = await this.node.allocateID()

        console.log(id)

        let propertyIndex = await this.createPropertyMap(id)
        let referenceIndex = await this.createPropertyMap(id)

        let node = {
            id,
            properties: propertyIndex.id,
            references: referenceIndex.id
        }

        let value: NodeData = [propertyIndex.id, referenceIndex.id]

        await this.node.setActual(id, value)

        return node
    }

    async createPropertyMap(node: number): Promise<PropertyMapIndex> {
        let bnode = await this.createLeafBNode()
        let index: PropertyMapIndex = {
            id: await this.index.allocateID(),
            type: IndexTypes.propertyMap,
            root: bnode.id,
            node: node
        }

        let value: PropertyMapData = [index.type, index.root, index.node, 0]

        await this.index.setActual(index.id, value)

        return index
    }

    /**
     * Create an empty leaf bnode in the collection
     */
    async createLeafBNode(): Promise<{ id: number }> {
        let id = await this.bnode.allocateID()
        let value: BNodeLeafData<PropertyMapValue> = [BNodeTypes.Leaf, [], []]

        await this.bnode.setActual(id, value)

        return {
            id
        }
    }

    /*
    Delete node cascade deletion
    - get power of and id
    - get data of node (property index id & references index id)
    - for each index id
        - call delete on index
    - delete powerof value
    - delete node
    */
    async deleteNode(id: number): Promise<DeleteNodeResponse> {
        let record = await this.node.get(id)

        if(!record) {
            throw new Error(`Node ${id} does not exist`)
        }
        let power = this.node.getOrCreatePower(record[0])
        let value = await power.get(record[1])

        if(!value) {
            throw new Error(`Power of ${record[0]} with id: ${record[1]} does not exist. This should never happen`)
        }

        for(let indexID of value) {
            await this.deletePropertyMapIndex(indexID)
        }

        await power.set(record[1], null)

        await this.node.set(id, null)

        return {
            id
        }
    }


    /**
     *  Delete propertyMapIndex cascade deletion
        - get power of and id
        - get data of property index (root, from)
        - call delete on root bnode
        - delete powerof value
        - delete property index
     */
    protected async deletePropertyMapIndex(id: number): Promise<void> {
        let record = await this.index.get(id)

        if(!record) {
            throw new Error(`Property index ${id} does not exist`)
        }
        let power = this.index.getOrCreatePower(record[0])

        let value = await power.get(record[1]) as PropertyMapData
        if(!value) {
            throw new Error(`Value of ${id} does not exist. This should never happen`)
        }

        await this.deleteNodeBNode(value[1])

        await power.set(record[1], null)

        await this.index.set(id, null)
    }

    /*
    Delete bnode cascade deletion
    - get power of and id
    - get type of bnode
    - if leaf
    - get values of bnode
    - foreach value
        - switch value.type
        - case propertyindex
            - call delete on property index
        - case edge
            - call delete on edge
        - case value
            - call delete on value
        - case node
            - ignore
    - if internal bnode
    - get children of bnode
    - foreach child of children
        - call delete on child
    - delete powerof value
    - delete bnode
    */
    protected async deleteNodeBNode(id: number): Promise<void> {
        let record = await this.bnode.get(id)

        if(!record) {
            throw new Error(`BNode ${id} does not exist`)
        }
        let power = this.bnode.getOrCreatePower(record[0])

        let bnode = await power.get(record[1])
        if(!bnode) {
            throw new Error(`Value of ${id} does not exist. This should never happen`)
        }


        if(bnode[0] === BNodeTypes.Leaf) {
            let [bnodetype, keys, values] = bnode as BNodeLeafData<PropertyMapValue>

            for(let value of values) {
                let [type, valueid] = value
                switch(type) {
                    case ValueTypes.index:
                        let id = await this.value.getActual(valueid) as number
                        await this.deletePropertyMapIndex(id)
                        await this.deleteValue(valueid)
                        break
                    case ValueTypes.edge:
                        let path = await this.value.getActual(valueid) as any[]
                        let edgeid = path[path.length - 1]
                        let edgecollection = path[path.length - 2] ?? this.opts.collection
                        let database = path[path.length - 3] ?? this.opts.database

                        let tx = this.tx
                        let db = tx.databases.get(database)
                        if(!db) {
                            throw new Error(`Database ${database} for edge does not exist`)
                        }
                        let collection = db.collections.get(edgecollection)
                        if(!collection) {
                            throw new Error(`Collection ${edgecollection} for edge does not exist`)
                        }
                        await collection.deleteEdge(edgeid)
                        // we don't need to call deleteValue because edge will call it
                        break
                    case ValueTypes.value:
                        await this.deleteValue(valueid)
                        break
                    case ValueTypes.node:
                        break
                    default:
                        throw new Error(`Unknown BNodeType ${value[0]}`)
                }
            }
        } else if(bnode[0] === BNodeTypes.Internal) {
            let [bnodetype, keys, children] = bnode as BNodeInternalData
            for(let child of children) {
                await this.deleteNodeBNode(child)
            }
        } else {
            throw new Error(`Unknown BNodeType ${bnode[0]}`)
        }

        await power.set(record[1], null)

        await this.bnode.set(id, null)
    }

    /**
    DeleteRecursivePathOfEdge(path, id)
    - let i = 1
    - let lastobj = path[0] as gettersetter type
    - while i < value.length
        - lastobj = lastobj.get(value[i++])
    - lastobj.delete(id)
    */
    protected async deleteRecursivePathOfEdge([path, keypath]: [any[], any[]], edgeid: number): Promise<void> {
        let database = path[path.length - 3] ?? this.opts.database
        let collection = path[path.length - 2] ?? this.opts.collection
        let id = path[path.length - 1]

        let tx = this.tx
        let db = tx.databases.get(database)
        if(!db) {
            throw new Error(`Database ${database} for edge's pointer does not exist`)
        }
        let coll = db.collections.get(collection)
        if(!coll) {
            throw new Error(`Collection ${collection} for edge's pointer does not exist`)
        }
        let node = await coll.getNode(id)
        if(!node) {
            throw new Error(`Node ${id} for edge's pointer does not exist`)
        }
        if(keypath.length === 0) {
            let referenceIndex = await coll.index.getOrInstantiate(node.references) as PropertyMap<any>
            await referenceIndex.delete(edgeid)
        } else {
            let lastobj = await coll.index.getOrInstantiate(node.properties) as PropertyMap<any>
            for(let key of keypath) {
                let v = await lastobj.get(key) as PropertyMapValue
                if(v[0] !== ValueTypes.index) {
                    throw new Error(`Value ${v} is not a property index`)
                }
                lastobj = await this.index.getActual(v[1]) as any
            }
            await lastobj.delete(edgeid)
        }
    }

    /**
     * Delete edge cascade deletion
    - get power of and id
    - get date of edge (property index id & references index id)
    - DeleteRecursivePathOfEdge(propertyindex.get('from'), id)
    - DeleteRecursivePathOfEdge(propertyindex.get('to'), id)
    - for each index id
    - call delete on index
    - delete powerof value
    - delete edge
     */
    protected async deleteEdge(id: number): Promise<void> {
        let record = await this.node.get(id)

        if(!record) {
            throw new Error(`Edge ${id} does not exist`)
        }
        let power = this.node.getOrCreatePower(record[0])

        let value = await power.get(record[1])
        if(!value) {
            throw new Error(`Value of ${id} does not exist. This should never happen`)
        }

        let [propertyindexid] = value

        let propertyindex = await this.index.getOrInstantiate(propertyindexid) as PropertyMap<any>
        let [, fromid] = await propertyindex.get('from') as PropertyMapValue
        let [, toid] = await propertyindex.get('to') as PropertyMapValue

        await this.deleteRecursivePathOfEdge(await this.value.get(fromid) as any, id)
        await this.deleteRecursivePathOfEdge(await this.value.get(toid) as any, id)

        for(let indexID of value) {
            await this.deletePropertyMapIndex(indexID)
        }

        await power.set(record[1], null)

        await this.node.set(id, null)
    }

    /**
    Delete value cascade deletion
        - get power of and id
        - delete powerof value
        - delete value
     */
    protected async deleteValue(id: number): Promise<void> {
        let record = await this.value.get(id)
        if(!record) {
            throw new Error(`Value ${id} does not exist`)
        }
        let power = this.value.getOrCreatePower(record[0])

        if(!power) {
            throw new Error(`Power of ${id} does not exist. This should never happen`)
        }
        await power.set(record[1], null)
        await this.value.set(id, null)
    }

    async setBNode(id: number, value: BNodeUnionData<PropertyMapValue>) {
        await this.bnode.setActual(id, value)
    }

    async getNode(id: number): Promise<NodeStruct | null> {
        let node = await this.node.getActual(id)
        if(!node) {
            return null
        }
        let [properties, references] = node
        return {
            id,
            properties,
            references
        }
    }
}