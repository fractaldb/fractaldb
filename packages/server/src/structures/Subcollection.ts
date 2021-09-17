
export enum BNodeTypes {
    Leaf = 0,
    Node = 1
}

export enum ValueTypes {
    value = 0,
    node = 1,
    index = 2
}
export type NodeData = [propertiesIndex: number, referenceIndex: number]
export type BNodeUnionData = BNodeLeafData | BNodeInternalData
export type BNodeLeafData = [type: number, keys: any[], values: number[]]
export type BNodeInternalData = [type: number, keys: any[], children: number[]]
export type ValueData = [type: ValueTypes, value: any]
export type IndexData = [type: number, rootBNode: number, ...data: any]