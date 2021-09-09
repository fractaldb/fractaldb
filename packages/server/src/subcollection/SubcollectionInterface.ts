
/**
 * Interface used by different layers to manage collection->subcollection data retrieval
 *
 * Used for docs, indexes and bnode id to value lookups
 */
export interface SubcollectionInterface {

    get(key: number): Promise<V | null>
    set(key: number, value: V): Promise<void>
    remove(key: number): Promise<void>
}