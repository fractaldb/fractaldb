
export interface HasGetterItems<V> {
    /**
     * If the value is null, it means it has been deleted
     * If it is undefined, it means it doesn't exist in the map, and a lower layer should be queried
     */
    get(id: number): Promise<V | null | undefined>
}