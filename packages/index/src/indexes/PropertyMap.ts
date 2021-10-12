import type { RootIndex } from '@fractaldb/fractal-server/interfaces/CollectionInterface.js'
import type TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import type { IndexDataUnion, PropertyMapValue } from '@fractaldb/fractal-server/structures/Subcollection.js'
import { IndexTypes } from '@fractaldb/shared/structs/DataTypes.js'
import { NodeStruct } from '@fractaldb/shared/structs/NodeStruct.js'
import BTree, { Comparator } from '../BTree.js'
import type { UniqueBTree } from './UniqueBTree.js'

// let edge = {

//     nodesWhichUseIt: [albert]
// }

// let node be albert
// let edge be new edge
// albert.propertyMap.get("country-of-citizenship").set(edge.id, NodePath<Edge>)
// let oldIndexes be the current indexes of albert before the update
// let newIndexes be the current indexes of albert after the update
// find a newIndex that contains a keyvalue pointing to an edge
// foreach edge, add the node to the edge's nodes list

type K = string | number
export class PropertyMap extends BTree<K, PropertyMapValue> {
    readonly type = IndexTypes.propertyMap
    // stores the id of the node that owns this index, used for ensuring that updates trigger root index updates on this node
    nodes: [id: number, collection?: string, database?: string][]

    // Get me all of the nodes which belong in <organisation:X> and
        // where <instance of:task>
        // where <assignee:me>

    constructor(txState: TransactionCollection, id: number, root: number, nodes: [id: number, collection?: string, database?: string][], size: number, maxNodeSize?: number, compare?: Comparator<K>) {
        super(txState, id, root, size, maxNodeSize, compare)
        this.nodes = nodes
    }

    deinstantiate(): IndexDataUnion {
        return [IndexTypes.propertyMap, this.root, this.nodes, this.size]
    }

    /**
     * Need to wrap setters with node index update functionality (compare old indexes vs new indexes)
     */


    /**
     *  - get node of index
     *  - let oldIndexes be the current indexes of the node based on the root indexes of the collection
     *  - apply set operation to the node's propertymap
     *  - call prepareindexes on the root indexes of the collection
     *  - let newIndexes be the current indexes of the node based on the root indexes of the collection
     *  - let shouldRemove be the indexes that are in oldIndexes but not in newIndexes
     *  - let shouldAdd be the indexes that are in newIndexes but not in oldIndexes
     *  - let shouldUpdate be the indexes that are in both oldIndexes and newIndexes
     *  - for each index in shouldRemove, call delete on the index with the keyvalue
     *  - for each index in shouldAdd, call set on the index with the new value
     *  - for each index in shouldUpdate, call set on the index with the new value
     */
    async set(key: K, value: PropertyMapValue): Promise<boolean> {
        let oldIndexes: [UniqueBTree, any][] = []
        let newIndexes: [UniqueBTree, any][] = []
        let rootIndexes: [RootIndex, NodeStruct][] = []

        for(let nodePath of this.nodes) {
            let database = nodePath[2] ?? this.txState.opts.database
            let collection = nodePath[1] ?? this.txState.opts.collection
            let nodeid = nodePath[0]
            let db = this.txState.tx.getOrCreateDatabase(database)
            let col = db.getOrCreateCollection(collection)
            let node = await col.getNode(nodeid) as NodeStruct
            for(let id of await col.getRootIndexes()) {
                let index = await col.index.getOrInstantiate(id) as unknown as RootIndex
                rootIndexes.push([index, node])
            }
        }

        for(let [rootIndex, node] of rootIndexes) {
            oldIndexes.push(...await rootIndex.getIndexesFor(node))
        }

        let result = await super.set(key, value)

        for(let [rootIndex, node] of rootIndexes) {
            await rootIndex.prepareIndexes(node)
            newIndexes.push(...await rootIndex.getIndexesFor(node))
        }

        let shouldRemove: [UniqueBTree, any][] = []
        for(let [index, keyValue] of oldIndexes) {
            if(!newIndexes.find(i => i[0].id === index.id)) {
                shouldRemove.push([index, keyValue])
            }
        }
        for(let [index, keyValue] of shouldRemove) {
            await index.delete(keyValue)
        }
        for(let [index, keyValue] of newIndexes) {
            if(!oldIndexes.find(i => i[0].id === index.id)) {
                // if(index.type === IndexTypes.unique) {
                //     // check if this index aleady has a value, throw an error if it isn't this node
                //     let current = await index.get(keyValue)
                //     if(this.nodes.includes(current)) {
                await index.set(keyValue, keyValue)
            }
        }

        return result
    }
}