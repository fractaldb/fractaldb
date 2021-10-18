
export enum BNodeTypes {
    Leaf = 1,
    Internal = 2
}

export enum ValueTypes {
    value = 1,
    node = 2,
    index = 3,
    edge = 4
}

export enum IndexTypes {
    propertyMap = 1,
    unique = 2,
    property = 3
}

export type FullNodePath = [database: string, collection: string, id: number]

export type IndexOperationNode = [type: ValueTypes.node, nodePath: FullNodePath]
export type IndexOperationValue = [type: ValueTypes.value, value: any]
export type IndexOperationIndex = [type: ValueTypes.index, indexID: number]
export type IndexOperationEdge = [type: ValueTypes.edge, edgePath: FullNodePath]

export type IndexOperation = IndexOperationNode | IndexOperationValue | IndexOperationIndex | IndexOperationEdge
