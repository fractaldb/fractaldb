
export enum BNodeTypes {
    Leaf = 0,
    Node = 1
}

export enum ValueTypes {
    value = 0,
    node = 1,
    index = 2
}

export type BNodeLeafValueData = [power: number, valueType: ValueTypes, ValuePowerID: number]

export type NodeData = [PropertyIndexID: number, ReferenceIndexID: number]
export type BNodeData = [power: number, type: BNodeTypes, BNodePowerID: number]

export type PowerOfBNodeUnionData = PowerOfBNodeLeafData | PowerOfBNodeData
export type PowerOfBNodeLeafData = [keys: any[], values: BNodeLeafValueData[]]
export type PowerOfBNodeData = [keys: any[], children: number[]]
export type PowerOfValueData = any
export type IndexData = [power: number, indexPowerID: number]
export type PowerOfIndexData = [type: number, rootBNodeID: number, ...data: any]