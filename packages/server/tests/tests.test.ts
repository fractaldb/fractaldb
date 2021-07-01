import { FractalClient } from '@fractaldb/fractal-client'
import { FractalServer } from '@fractaldb/fractal-server'
import { EntityID } from '@fractaldb/adn/EntityID.js'
import { runner } from '@framework-tools/catchit'

let server = new FractalServer()
await server.start()

export let client = new FractalClient()

let { describe, expect, run, test} = runner()

describe('docs', () => {
    test('can save empty doc and find an item', async () => {
        let doc = { test: 'a' }
        let col = client.db('main').collection('items')
        await col.insertOne(doc)
        let { entity } = await col.findOne({});
        let entityID = entity?.entityID
        if(entity) delete entity['entityID']
        expect(entity).toBe(doc)
        expect(entityID instanceof EntityID).toBe(true)
    })
})

await run()

await server.stop()
await client.close()

export {}