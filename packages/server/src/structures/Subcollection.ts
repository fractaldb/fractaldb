
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
    propertyMap = 0
}

export type PropertyMapValue = [type: ValueTypes, id: number]

export type NodeData = [propertiesIndex: number, referenceIndex: number]
export type BNodeUnionData<V> = BNodeLeafData<V> | BNodeInternalData
export type BNodeLeafData<V> = [type: BNodeTypes.Leaf, keys: any[], values: V[]]
export type BNodeInternalData = [type: BNodeTypes.Internal, keys: any[], children: number[]]
export type ValueData = any
export type IndexDataUnion = PropertyMapIndexData // union

export type PropertyMapIndexData = [type: IndexTypes.propertyMap, root: number, node: number, size: number]