import { RootIndex } from '@fractaldb/fractal-server/interfaces/CollectionInterface.js'
import TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import { IndexDataUnion, IndexTypes, PropertyMapValue } from '@fractaldb/fractal-server/structures/Subcollection.js'
import { NodeStruct } from '@fractaldb/shared/structs/NodeStruct.js'
import BTree, { Comparator } from '../BTree.js'
import { UniqueBTree } from './UniqueBTree.js'

export class PropertyMap<K> extends BTree<K, PropertyMapValue> {

    // stores the id of the node that owns this index, used for ensuring that updates trigger root index updates on this node
    node: number

    constructor(txState: TransactionCollection, id: number, root: number, node: number, size: number, maxNodeSize?: number, compare?: Comparator<K>) {
        super(txState, id, root, size, maxNodeSize, compare)
        this.node = node
    }

    deinstantiate(): IndexDataUnion {
        return [IndexTypes.propertyMap, this.root, this.node, this.size]
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
        let node = await this.txState.getNode(this.node) as NodeStruct
        let rootIndexes = await Promise.all(this.txState.rootIndexes.map(async id => await this.txState.index.getOrInstantiate(id) as unknown as RootIndex))

        let oldIndexes: [UniqueBTree<any>, any][] = []
        let newIndexes: [UniqueBTree<any>, any][] = []
        for(let rootIndex of rootIndexes) {
            oldIndexes.push(...await rootIndex.getIndexesFor(node))
        }

        let result = await super.set(key, value)

        for(let rootIndex of rootIndexes) {
            await rootIndex.prepareIndexes(node)
            newIndexes.push(...await rootIndex.getIndexesFor(node))
        }

        let shouldRemove: [UniqueBTree<any>, any][] = []
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
                await index.set(keyValue, keyValue)
            }
        }
        return result
    }
}