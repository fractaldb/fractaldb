export type DatabaseOpts = {
    database: string
}

export type CollectionOpts = {
    collection: string
} & DatabaseOpts

export type SubcollectionOpts = {
    subcollection: 'bnode' | 'node' | 'value' | 'index',
} & CollectionOpts

export type PowerOpts = {
    power: number
} & SubcollectionOpts