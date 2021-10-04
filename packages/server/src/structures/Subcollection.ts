
export enum BNodeTypes {
    Leaf = 0,
    Internal = 1
}

export enum ValueTypes {
    value = 0,
    node = 1,
    index = 2,
    edge = 3
}

export enum IndexTypes {
    propertyMap = 0,
    unique = 1,
    property = 2
}

export type PropertyMapValue = [type: ValueTypes, id: number]

export type NodeData = [propertiesIndex: number, referenceIndex: number]
export type BNodeUnionData<V> = BNodeLeafData<V> | BNodeInternalData
export type BNodeLeafData<V> = [type: BNodeTypes.Leaf, keys: any[], values: V[]]
export type BNodeInternalData = [type: BNodeTypes.Internal, keys: any[], children: number[]]
export type ValueData = any
export type IndexDataUnion = PropertyMapData | PropertyIndexData | UniqueIndexData // union

export type PropertyMapData = [type: IndexTypes.propertyMap, root: number, node: number, size: number]
// unique paths can be undefined because they will default to [] which will check the nodes ID as the path
export type PropertyIndexData = [type: IndexTypes.property, propertyPath: any[], root: number,  size: number, uniquePropertyPath?: any[]]
export type UniqueIndexData = [type: IndexTypes.unique, root: number, size: number, uniquePropertyPath?: any[], subindexes?: number[]]