import { FractalClient } from './Client'
import Collection from './Collection'

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