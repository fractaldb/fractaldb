import Collection from './Collection.js'
import Database from './Database.js'
import { randomBytes } from 'crypto'

export class FractalNamespace {
    db: Database
    collection: Collection

    constructor(db: Database, collection: Collection) {
        this.db = db
        this.collection = collection
    }
}

/**
 * Generate a UUIDv4
 */
export const uuidV4 = () => {
    const result = randomBytes(16)
    result[6] = (result[6] & 0x0f) | 0x40
    result[8] = (result[8] & 0x3f) | 0x80
    return result
}