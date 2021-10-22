import { FractalClient } from '@fractaldb/fractal-client'
import { FractalServer } from '@fractaldb/fractal-server'
import { runner } from '@framework-tools/catchit'
import { ValueTypes } from '@fractaldb/shared/structs/DataTypes.js'
import { NodeStruct } from '@fractaldb/shared/structs/NodeStruct'
import HasItemsAbstract from '../dist/layers/transaction/abstract/HasItemsAbstract'

let { describe, expect, run, test} = runner()

let server = new FractalServer()
await server.start()

export let client = new FractalClient()

let col = client.db('main').collection('items')



    // `test('can save empty doc and find an item', async () => {
    //     // let doc = { test: 'a' }
    //     // await col.insertOne(doc)
    //     // let { entity } = await col.findOne({});
    //     // let entityID = entity?.entityID
    //     // if(entity) delete entity['entityID']
    //     // expect(entity).toBe(doc)
    //     // expect(entityID instanceof EntityID).toBe(true)
    // })


    // BENCHMARK CODE
    // check the time to read a doc 100k times

// console.time('create')
// let itr = 10000
// // let arr = new Array(itr)
// let promises = []
// // let promises = arr.map(() => col.findOne({}))
// for(let i = 0; i < itr; i++) {
//     promises.push(col.createNode())
// }
// let results = await Promise.all(promises)
// console.timeEnd('create')

    // await server.stop()
    // await client.close()`

describe('locking system', () => {
    test.todo('deadlock throws TransientError to transaction during a deadlock (offender)')
    test.todo('deadlock throws TransientError to transaction during a deadlock (non-offending)')
})

describe('get multiple values simultanously', () => {
    test('can get same node simultanously', async () => {
        let tx1 = server.beginTx()
        let tx2 = server.beginTx()

        let hasItems1 = {
            tx: tx1,
            releaseLockCallbacks: [],
        }
        let hasItems2 = {
            tx: tx2,
            releaseLockCallbacks: [],
        }

        let lock1 = server.lockEngine.tryToAcquireLock('abc', tx1, hasItems1 as any).then(() => {
            hasItems1.releaseLockCallbacks.map((cb: any) => cb())
        })
        let lock2 = server.lockEngine.tryToAcquireLock('abc', tx2, hasItems2 as any).then(() => {
            hasItems2.releaseLockCallbacks.map((cb: any) => cb())
        })

        await Promise.all([lock1, lock2])
    })
    test('can delete nodes simultanously', async () => {
        let node1 = await col.createNode()
        let node2 = await col.createNode()

        let prom1 = col.deleteNode(node1.id)
        let prom2 = col.deleteNode(node2.id)

        await Promise.all([prom1, prom2])
    })
})

describe('indexes', () => {
    test('can create root indexes', async () => {
        let node = await col.createNode()
        await col.indexSet(node.properties, 'email', [ValueTypes.value, 'abc@xyz.com'])
        let { id } = await col.ensureRootIndex('unique', ['email'], false)
        await col.deleteNode(node.id)
    })

    test('can findMany using unique root index', async () => {
        let node = await col.createNode()
        await col.indexSet(node.properties, 'email', [ValueTypes.value, 'abc@test.com'])
        let result = await col.findMany({
            email: 'abc@test.com'
        })
        await col.deleteNode(node.id)
        expect(result.nodes.find((n: NodeStruct) => n.id === node.id)?.id).toBe(node.id)
    })

    test('Node can have array values', async () => {
        let node = await col.createNode()
        await col.indexSet(node.properties, 'arr', [ValueTypes.value, ['abc', 'xyz']])
        let { type, value } = await col.indexGet(node.properties, 'arr')
        await col.deleteNode(node.id)
        expect(value).toBe(['abc', 'xyz'])
        expect(type).toBe(ValueTypes.value)
    })
})

// describe('subcollections', () => {
//     describe('nodes', () => {
//         test('nodes can be created', async () => {
//             let node = await col.createNode()

//             expect(node.database).toBe('main')
//             expect(node.collection).toBe('items')
//         })
//         test('nodes can be deleted', async () => {
//             await col.deleteNode(1)
//         })

//         test('node properties can be updated', async () => {
//             let node = await col.createNode()
//             await col.indexSet(node.properties, 'key', [ValueTypes.value, 'value'])
//             let { type, value } = await col.indexGet(node.properties, 'key')
//             expect(value).toBe('value')
//             expect(type).toBe(ValueTypes.value)
//         })
//         test.todo('nodes can be queried')
//         test.todo('nodes delete old RecordValues when updating')
//         test.todo('nodes persist across restarts')
//     })
//     test.todo('old recordvalues are deleted when updating size of a value')
//     test.todo('set operations use freeIDs')
//     test.todo('record changes persist across restarts')
//     test.todo('power changes persist across restarts')
//     test.todo('power collection values go to correct power of allocation locations')
// })



describe('subcollection ID system', () => {
    test.todo('highestID increments')
    test.todo('freeIDs get used')
    test.todo('logs recover old ID state on restart')
})

describe('power ID system', () => {
    test.todo('highestID increments')
    test.todo('freeIDs get used')
    test.todo('logs recover old ID state on restart')
})

describe('database transaction system', () => {
    test.todo('can do a read operation in transaction')
    test.todo('can do a write operation in transaction')
    test.todo('transactions dont leak state between eachother')
    test.todo('transaction log txCount increments in case of succesful write transaction')
    test.todo('transaction log txCount does not increment in case of failed write transaction')
    test.todo('transaction log rotates when full of write transactions')
    test.todo('transaction log notifies persistence engine when it is full')
})

await run()

await server.stop()