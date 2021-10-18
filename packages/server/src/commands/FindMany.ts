import { PropertyBTree } from '@fractaldb/indexing-system/indexes/PropertyBTree.js'
import { PropertyMap } from '@fractaldb/indexing-system/indexes/PropertyMap.js'
import { UniqueBTree } from '@fractaldb/indexing-system/indexes/UniqueBTree.js'
import { FindMany, FindManyResponse } from '@fractaldb/shared/operations/FindMany.js'
import { IndexTypes, ValueTypes } from '@fractaldb/shared/structs/DataTypes.js'
import { NodeStruct } from '@fractaldb/shared/structs/NodeStruct.js'
import { RootIndex } from '../interfaces/CollectionInterface.js'
import Transaction from '../layers/transaction/Transaction.js'
import TransactionCollection from '../layers/transaction/TransactionCollection.js'

export function turnPathStringToPath(path: string): (number|string)[] {
    // a path is a string of keys separated by dots
    // e.g. "a.1.c"
    // we need to turn it into an array of keys
    // ensuring that keys which start with a number are converted to numbers
    // e.g. "a.1.c" -> ["a", 1, "c"]
    return path.split('.').map(key => {
        if (key.match(/^[0-9]+$/)) {
            return parseInt(key, 10)
        }
        return key
    })
}

/**
 * let keys = Object.keys(op.query)
 * let bestindex = null
 * let i = 0
 * while (i < keys.length)
 *    let index be rootIndexes.find(index => index.key === keys[i])
 *    if (index)
 *      bestindex = index
 *   i++
 * if (bestindex)
 *  return bestindex.forRange(op.query[bestindex.key], node => {
 *      if(node.hasAllValues(op.query))
 *         return node
 *       })
 *   })
 * else
 *  return collection.nodes.find(node => node.hasAllValues(op.query))
 * }
 *
 */
export async function FindManyCommand (op: FindMany, tx: Transaction): Promise<FindManyResponse> {

    let db = tx.getOrCreateDatabase(op.database)
    let collection = db.getOrCreateCollection(op.collection)

    let query = Object.entries(op.query ?? {}) as [string, any][]
    let bestindex: RootIndex | null = null
    let rootIndexesIDs = await collection.getRootIndexes()
    // these would be the root indexes starting out
    let subindexIDs = rootIndexesIDs
    if(query[0][0] === 'id') {
        // if the query is just an id, we can just return the node
        let node = await collection.getNode(query[0][1])
        if(node) {
            return {
                nodes: [node]
            }
        } else {
            return {
                nodes: []
            }
        }
    }

    let adn = tx.server.adn
    let i = 0
    while (i < query.length) {
        let subindexes = await Promise.all(subindexIDs.map(id => collection.index.getOrInstantiate(id))) as unknown as RootIndex[]
        let propertyPath = turnPathStringToPath(query[i][0]) // get the property path
        let value = query[i][1] // get the value

        let index = subindexes.find(index => adn.serialize(propertyPath) === adn.serialize(index.propertyPath))
        if(index) {
            bestindex = index
            let uniqueIndex = index instanceof UniqueBTree ? index : null
            if(index.type === IndexTypes.property) {
                let uniqueIndexID = await index.get(value)
                if(uniqueIndexID) {
                    uniqueIndex = await collection.index.getOrInstantiate(uniqueIndexID) as UniqueBTree
                }
            }
            if(uniqueIndex) subindexIDs = [...uniqueIndex.subindexes]
        }
        i++
    }
    let nodes: NodeStruct[] = []

    if(bestindex) {
        let key = bestindex.propertyPath.join('.')
        let value = op.query[key]

        if (bestindex instanceof PropertyBTree) {
            let UniqueIndexID = await bestindex.get(value)
            if (UniqueIndexID) {
                let index = await collection.index.getOrInstantiate(UniqueIndexID)
                if (index) {
                    let i = 0
                    await index.forRange(await index.minKey(), await index.maxKey(), true, async (k, v, counter) => {
                        let node = await collection.getNode(v) as NodeStruct
                        if(await nodeHasAllValues(collection, node, op.query)) {
                            nodes.push(node)
                            i++
                            if(i === op.limit){
                                return {
                                    break: true
                                }
                            }
                        }
                    })
                }
            }
        } else if (bestindex instanceof UniqueBTree) { // this will always return one node
            let nodeID = await bestindex.get(value)

            console.log('nodeid', nodeID)
            if (nodeID) {
                let node = await collection.getNode(nodeID) as NodeStruct
                if(await nodeHasAllValues(collection, node, op.query)) {
                    nodes.push(node)
                }
            }
        }
    } else {
        // TOOD this should be searching through the whole collection
    }
    return {
        nodes
    }
}


export async function nodeHasAllValues(collection: TransactionCollection, node: NodeStruct, query: [any, any][]): Promise<boolean> {
    for(let i = 0; i < query.length; i++) {
        if(!await nodeHasValue(collection, node, turnPathStringToPath(query[i][0]), query[i][1])) {
            return false
        }
    }
    return true
}

export async function nodeHasValue(collection: TransactionCollection, node: NodeStruct, keyPath: any[], queryValue: any): Promise<boolean> {
    let index = await collection.index.getOrInstantiate(node.properties) as PropertyMap | null
    let i = 0
    while(i < keyPath.length) {
        if(!index) return false
        let nextValue = await index.get(keyPath[i])
        if(!nextValue) return false
        let [type, id] = nextValue

        let value = await collection.value.getActual(id)
        // if we're on the last index, we can check if the value is equal to value and return true
        if(i === keyPath.length - 1) {
            if(type === ValueTypes.value) {
                if(value === queryValue) {
                    return true
                }
            }
            if(type === ValueTypes.node) {
                if(value === queryValue) {
                    return true
                }
            }
            if(type === ValueTypes.edge) {
                if(value === queryValue) {
                    return true
                }
            }
            return false
        }
        // if we're not on the last index, we need to get the next index
        if(type !== ValueTypes.index) return false

        index = await collection.index.getOrInstantiate(value) as PropertyMap
    }
    return false
}