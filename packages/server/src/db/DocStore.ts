
// this is the database representation of the docs

import JSONObject from '@fractaldb/shared/utils/JSONObject'

export type internalID = number
export type entityID = string
export type EntityObj = {
    entityID: entityID,
    doc: JSONObject
}
export type Entity = { internalID: internalID } & EntityObj
export type EntityMap = Map<internalID, EntityObj>
export type InsertedID = {
    internalID: internalID,
    entityID: entityID
}

function matchesQuery(doc: JSONObject, query: JSONObject) {
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
        // add indexing here currently O(log n)
        let iter = this.docs.entries()

        for (const [internalID, { entityID, doc }] of iter) {
            if(!matchesQuery(doc, query)) continue

            return {
                internalID,
                entityID,
                doc
            }
        }

        return null
    }

    find(query: any): Entity[] {
        // add indexing here currently O(n)
        let iter = this.docs.entries()
        let docs: Entity[] = []
        for (const [internalID, { entityID, doc }] of iter) {
            if(!matchesQuery(doc, query)) continue

            docs.push({
                internalID,
                entityID,
                doc
            })
        }

        return docs
    }

    findByInternalID(internalID: number): Entity | null {
        let entity = this.docs.get(internalID)
        if(!entity) return null
        return {
            internalID,
            entityID: entity.entityID,
            doc: entity.doc
        }
    }

    nextID(): number {
        if(this.availableIDs.length > 1) return this.availableIDs.pop() as number
        return this.highestID++
    }
}