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
    test('can create a node', async () => {
        let node = await col.createNode()
        await col.createNode()
        await col.createNode()
        await col.createNode()
        await col.createNode()
        // expect(node.name).toBe('test')
        // expect(node.description).toBe('test')
    })
    test('can save empty doc and find an item', async () => {
        // let doc = { test: 'a' }
        // await col.insertOne(doc)
        // let { entity } = await col.findOne({});
        // let entityID = entity?.entityID
        // if(entity) delete entity['entityID']
        // expect(entity).toBe(doc)
        // expect(entityID instanceof EntityID).toBe(true)
    })

    test.todo('deadlock throws TransientError to transaction during a deadlock (offender)')
    test.todo('deadlock throws TransientError to transaction during a deadlock (non-offending)')


    // BENCHMARK CODE
    // check the time to read a doc 100k times

    // let arr = new Array(100000)
    // let promises = arr.map(() => col.findOne({}))
    // for(let i = 0; i < 100000; i++) {
    //     col.findOne({})

    // await server.stop()
    // await client.close()
})

describe('database transaction system', () => {
    test.todo('can do a read operation in transaction')
    test.todo('can do a write operation in transaction')
    test.todo('transaction log txCount increments in case of succesful write transaction')
    test.todo('transaction log txCount does not increment in case of failed write transaction')
    test.todo('transaction log rotates when full of write transactions')
    test.todo('transaction log notifies persistence engine when it is full')
})

await run()



export {}