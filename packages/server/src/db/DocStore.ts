
// this is the database representation of the docs
import { Entity } from '@fractaldb/shared/utils/Entity.js'
import { EntityID } from '@fractaldb/adn/EntityID.js'

export type EntityMap = Map<number, Entity>

export function matchesQuery(doc: any, query: any) {
    let match = true
    for (const prop in query) {
        if (doc[prop] !== query[prop]) {
            match = false
            break
        }
    }
    return match
}

export class DocStore {
    availableIDs: number[] = []
    highestID: number
    docs: EntityMap
    constructor(docs: EntityMap) {
        this.docs = docs
        this.highestID = docs.size + 1
    }

    findOne(query: any): Entity | null {
        // add indexing here currently O(n) instead of O(log n)
        let iter = this.docs.entries()

        for (const [internalID, doc] of iter) {
            if(!matchesQuery(doc, query)) continue

            return doc
        }

        return null
    }

    find(query: any): Entity[] {
        // add indexing here currently O(n)
        let iter = this.docs.entries()
        let docs: Entity[] = []
        for (const [internalID, doc] of iter) {
            if(!matchesQuery(doc, query)) continue

            docs.push(doc)
        }

        return docs
    }

    findByEntityID(entityID: EntityID): Entity | null {
        let entity = this.docs.get(entityID.internalID)
        if(!entity) return null
        return entity
    }

    nextID(): number {
        if(this.availableIDs.length > 1) return this.availableIDs.pop() as number
        return this.highestID++
    }
}