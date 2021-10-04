

export default interface HasItemsInterface<V> {
    items: Map<number, string | null> // ADN strings

    /**
     * If the value is null, it means it has been deleted
     * If it is undefined, it means it doesn't exist in the map, and a lower layer should be queried
     */
    get(id: number): Promise<V | null | undefined>
}
