

export default interface HasItemsInterface<V> {
    items: Map<number, string | null> // ADN strings

    get(id: number): Promise<V | null>
}
