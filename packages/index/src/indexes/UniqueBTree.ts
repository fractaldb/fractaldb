import TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import { IndexDataUnion, IndexTypes, PropertyMapValue, UniqueIndexData, ValueTypes } from '@fractaldb/fractal-server/structures/Subcollection.js'
import { NodeStruct } from '@fractaldb/shared/structs/NodeStruct.js'
import BTree from '../BTree.js'
import { PropertyBTree } from './PropertyBTree.js'
import { PropertyMap } from './PropertyMap.js'

// value will always be a node's number in uniqueBTrees
export class UniqueBTree<K> extends BTree<K, number> {
    propertyPath: string[]
    subindexes: number[] // ids of UniqueBTrees or PropertyIndexes

    constructor(txState: TransactionCollection, id: number, propertyPath: string[], root: number, size: number, subindexes: number[], maxNodeSize?: number, ) {
        super(txState, id, root, size, maxNodeSize)
        this.subindexes = subindexes
        this.propertyPath = propertyPath
    }

    deinstantiate(): UniqueIndexData {
        let path = this.propertyPath.length === 0 ? undefined : this.propertyPath
        let subindexes = this.subindexes.length === 0 ? undefined : this.subindexes
        return [IndexTypes.unique, this.root, this.size, path, subindexes] as UniqueIndexData
    }

    async getIndexesFor(node: NodeStruct): Promise<[UniqueBTree<K>, any][]> {
        let value = await this.getValueOfNode(node)

        if(value === undefined) return []

        let subindexes = []
        for (let subindexid of this.subindexes) {
            let subindex = await this.txState.index.getOrInstantiate(subindexid) as unknown as PropertyBTree<any, any>
            subindexes.push(...await subindex.getIndexesFor(node))
        }
        return [[this, value], ...subindexes]
    }

    async getValueOfNode(node: NodeStruct): Promise<any | undefined> {
        if(this.propertyPath.length === 0) {
            // use the node id as the unique value
            return node.id
        }

        let index = await this.txState.index.getOrInstantiate(node.properties) as PropertyMap<K>

        let i = 0
        while(i < this.propertyPath.length) {
            let value = await index.get(this.propertyPath[i] as unknown as K) as PropertyMapValue

            if(value === undefined) return undefined // this path doesn't exist, return undefined early
            let [type, id] = value
            switch (type) {
                case ValueTypes.index: {
                    index = await this.txState.index.getOrInstantiate(id) as PropertyMap<K>
                    if(i === this.propertyPath.length - 1) {
                        return index
                    }
                    break
                }
                case ValueTypes.value: {
                    if(i === this.propertyPath.length - 1) {
                        return await this.txState.value.getActual(id)
                    }
                    return undefined
                }
                default : {
                    return undefined
                }
            }
            i++
        }
    }

    async prepareIndexes(node: NodeStruct): Promise<void> {
        let propertyValue = this.getValueOfNode(node)
        let belongsToIndex = propertyValue !== undefined
        if(belongsToIndex) {
            let i = 0
            while(i < this.subindexes.length) {
                let subindex = await this.txState.index.getOrInstantiate(this.subindexes[i]) as PropertyBTree<any, any>
                await subindex.prepareIndexes(node)
            }
        }
    }
}