import { FractalClient } from '@fractaldb/fractal-client'
import { FractalServer } from '@fractaldb/fractal-server'
import { EntityID } from '@fractaldb/adn/EntityID.js'
import { runner } from '@framework-tools/catchit'

let { describe, expect, run, test} = runner()

let server = new FractalServer()
await server.start()

export let client = new FractalClient()

let col = client.db('main').collection('items')

describe('docs', () => {
    test('can save empty doc and find an item', async () => {
        let doc = { test: 'a' }
        await col.insertOne(doc)
        let { entity } = await col.findOne({});
        let entityID = entity?.entityID
        if(entity) delete entity['entityID']
        expect(entity).toBe(doc)
        expect(entityID instanceof EntityID).toBe(true)
    })
})

await run()

// check the time to read a doc 100k times

let arr = new Array(100000)
let promises = arr.map(() => col.findOne({}))
for(let i = 0; i < 100000; i++) {
    col.findOne({})

await server.stop()
await client.close()

export {}