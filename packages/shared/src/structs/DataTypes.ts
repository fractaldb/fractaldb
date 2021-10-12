
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

export type FullNodePath = [database: string, collection: string, id: number]

export type IndexOperationNode = [type: ValueTypes.node, nodePath: FullNodePath]
export type IndexOperationValue = [type: ValueTypes.value, value: any]
export type IndexOperationIndex = [type: ValueTypes.index, indexID: number]
export type IndexOperationEdge = [type: ValueTypes.edge, edgePath: FullNodePath]

export type IndexOperation = IndexOperationNode | IndexOperationValue | IndexOperationIndex | IndexOperationEdge
