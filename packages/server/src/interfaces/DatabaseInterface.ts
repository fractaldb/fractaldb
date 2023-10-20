import CollectionInterface from './CollectionInterface.js'

export default interface DatabaseInterface {
    collections: Map<string, CollectionInterface | null>
}