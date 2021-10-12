import { ValueTypes, BNodeTypes, IndexTypes } from '@fractaldb/shared/structs/DataTypes.js'

export type PropertyMapValue = [type: ValueTypes, id: number]

export type NodeData = [propertiesIndex: number, referenceIndex: number]
export type BNodeUnionData<V> = BNodeLeafData<V> | BNodeInternalData
export type BNodeLeafData<V> = [type: BNodeTypes.Leaf, keys: any[], values: V[]]
export type BNodeInternalData = [type: BNodeTypes.Internal, keys: any[], children: number[]]
export type ValueData = any
export type IndexDataUnion = PropertyMapData | PropertyIndexData | UniqueIndexData // union

export type PropertyMapData = [type: IndexTypes.propertyMap, root: number, nodePaths: [id: number, collection?: string, database?: string][], size: number]
// unique paths can be undefined because they will default to [] which will check the nodes ID as the path
export type PropertyIndexData = [type: IndexTypes.property, propertyPath: any[], root: number,  size: number, uniquePropertyPath?: any[]]
export type UniqueIndexData = [type: IndexTypes.unique, root: number, size: number, uniquePropertyPath?: any[], subindexes?: number[]]