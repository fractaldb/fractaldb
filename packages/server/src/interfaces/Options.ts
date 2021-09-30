
export type ValidSubcollections = 'bnode' | 'node' | 'value' | 'index'

export type DatabaseOpts = {
    database: string
}

export type CollectionOpts = {
    collection: string
} & DatabaseOpts

export type SubcollectionOpts = {
    subcollection: ValidSubcollections
} & CollectionOpts

export type PowerOpts = {
    power: number
} & SubcollectionOpts