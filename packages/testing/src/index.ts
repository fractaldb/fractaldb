import { FractalServer } from '@fractaldb/fractal-server'
import { FractalClient } from '@fractaldb/fractal-client'

let server = new FractalServer()

await server.start()

let client = new FractalClient()

let items = client.db('main').collection('items')

console.log(await items.insertOne({}))
