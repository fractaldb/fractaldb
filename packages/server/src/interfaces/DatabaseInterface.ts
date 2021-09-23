import CollectionInterface from './CollectionInterface'

export default interface DatabaseInterface {
    collections: Map<string, CollectionInterface | null>
}