import { FractalClient } from './Client.js'
import Collection from './Collection.js'

export default class Database {
    name: string
    client: FractalClient

    constructor(name: string, client: FractalClient){
        this.name = name
        this.client = client
    }

    collection(name: string){
        return new Collection(name, this)
    }
}