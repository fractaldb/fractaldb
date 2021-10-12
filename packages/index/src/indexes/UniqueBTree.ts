import type TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import type { PropertyMapValue, UniqueIndexData } from '@fractaldb/fractal-server/structures/Subcollection.js'
import { IndexTypes, ValueTypes } from '@fractaldb/shared/structs/DataTypes.js'
import type{ NodeStruct } from '@fractaldb/shared/structs/NodeStruct.js'
import BTree from '../BTree.js'
import type { PropertyBTree } from './PropertyBTree.js'
import type { PropertyMap } from './PropertyMap.js'

// value will always be a node's number in uniqueBTrees

type K = string | number
export class UniqueBTree extends BTree<K, number> {
    readonly type = IndexTypes.unique
    propertyPath: (string|number)[]
    subindexes: number[] // ids of UniqueBTrees or PropertyIndexes

    constructor(txState: TransactionCollection, id: number, propertyPath: (string|number)[], root: number, size: number, subindexes: number[], maxNodeSize?: number, ) {
        super(txState, id, root, size, maxNodeSize)
        this.subindexes = subindexes
        this.propertyPath = propertyPath
    }

    deinstantiate(): UniqueIndexData {
        let path = this.propertyPath.length === 0 ? undefined : this.propertyPath
        let subindexes = this.subindexes.length === 0 ? undefined : this.subindexes
        return [IndexTypes.unique, this.root, this.size, path, subindexes] as UniqueIndexData
    }

    async getIndexesFor(node: NodeStruct): Promise<[UniqueBTree, any][]> {
        let value = await this.getValueOfNode(node)

        if(value === undefined) return []

        let subindexes = []
        for (let subindexid of this.subindexes) {
            let subindex = await this.txState.index.getOrInstantiate(subindexid) as unknown as PropertyBTree
            subindexes.push(...await subindex.getIndexesFor(node))
        }
        return [[this, value], ...subindexes]
    }

    async getValueOfNode(node: NodeStruct): Promise<any | undefined> {
        if(this.propertyPath.length === 0) {
            // use the node id as the unique value
            return node.id
        }

        let index = await this.txState.index.getOrInstantiate(node.properties) as PropertyMap

        let i = 0
        while(i < this.propertyPath.length) {
            let value = await index.get(this.propertyPath[i]) as PropertyMapValue

            if(value === undefined) return undefined // this path doesn't exist, return undefined early
            let [type, id] = value
            switch (type) {
                case ValueTypes.index: {
                    index = await this.txState.index.getOrInstantiate(id) as PropertyMap
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
                case ValueTypes.node: {
                    if(i === this.propertyPath.length - 1) {
                        let nodepath = await this.txState.value.getActual(id)
                        // nodepath should turn into an ADN string so we can set it in the BTree
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
                let subindex = await this.txState.index.getOrInstantiate(this.subindexes[i]) as PropertyBTree
                await subindex.prepareIndexes(node)
            }
        }
    }
}