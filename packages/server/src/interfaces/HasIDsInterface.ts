
import HasItemsInterface from './HasItemsInterface.js'

export default interface HasIDs<V> extends HasItemsInterface<V> {
    highestID: number

    usedIDs: Set<number>
    freeIDs: Set<number>
}