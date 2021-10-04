import { NodeStruct } from '@fractaldb/shared/structs/NodeStruct.js'
import TransactionCollection from '@fractaldb/fractal-server/layers/transaction/TransactionCollection.js'
import BTree, { EmptyLeaf } from '../BTree.js'
import { UniqueBTree } from './UniqueBTree.js'
import { IndexTypes, PropertyIndexData, PropertyMapValue, ValueTypes } from '@fractaldb/fractal-server/structures/Subcollection.js'
import { PropertyMap } from './PropertyMap.js'

export class PropertyBTree<K, V> extends BTree <string, UniqueBTree<K>> {
    propertyPath: string[]
    uniquePropertyPath: string[]

    constructor(txState: TransactionCollection, id: number, propertyPath: string[], root: number, uniquePropertyPath: string[], size: number, maxNodeSize?: number){
        super(txState, id, root, size, maxNodeSize)
        this.propertyPath = propertyPath
        this.uniquePropertyPath = uniquePropertyPath
    }

    deinstantiate(): PropertyIndexData {
        let path = this.uniquePropertyPath.length === 0 ? undefined : this.uniquePropertyPath
        return [IndexTypes.property, this.propertyPath, this.root, this.size, path] as PropertyIndexData
    }

    // check if a given value should belong in this index
    // check if each property in the paths is a property of value
    shouldAddToIndex(node: NodeStruct): boolean {
        let propertyValue = this.getValueOfNode(node)
        if(propertyValue !== undefined) return true
        return false
    }

    async getValueOfNode(node: NodeStruct): Promise<any | undefined> {
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
                        return await this.txState.value.getActual(id) as V
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

    /*
     * propertyIndex.getIndexesFor(node): [index: Index, propertyValue: any][]
        - let index be tx.getIndex(node.propertyIndex)
        - iterate through paths of index and get the value of the node
        - if the value is not in the index, return []
        - else
            let value = index.get(value)
            return [[this, value], ...valueIndexes.getIndexesFor(node)]
     * - belongsToIndex = this.shouldBelongToIndex(doc)
     * - let value = doc[this.property]
     * - if belongsToIndex is null
     * - return []
     * - else
     * - return [[this, value], ...value.getIndexesFor(doc)]
     */
    async getIndexesFor(node: NodeStruct): Promise<[UniqueBTree<K>, any][]> {
        let propertyValue = await this.getValueOfNode(node)
        let belongsToIndex = propertyValue !== undefined
        if(!belongsToIndex) {
            return []
        } else {
            let valueIndex = await this.get(propertyValue) as UniqueBTree<K>
            let valueIndexes = await valueIndex.getIndexesFor(node)
            // node isn't added to this index, because it only holds the uniqueBtree
            return valueIndexes
        }
    }

    /**
     * Do not call this function before checking if the node should belong to this index
     */
    async prepareIndexes(node: NodeStruct): Promise<void> {
        let propertyValue = await this.getValueOfNode(node)

        if(propertyValue === undefined) return // node doesn't belong to this index
        let index = await this.get(propertyValue)

        if(!index) {
            let emptyLeafNode = await EmptyLeaf(this.txState)
            let id = await this.txState.index.allocateID()
            index = new UniqueBTree<K>(this.txState, id, this.uniquePropertyPath, emptyLeafNode.id, 0, [], this.maxNodeSize)
            await this.set(propertyValue, index)
        }

        await index.prepareIndexes(node)
    }
}