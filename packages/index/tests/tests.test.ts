import { runner } from '@framework-tools/catchit'
import BTree from '@fractaldb/indexing-system/BTree.js'
import { ValueIndex, PropertyIndex } from '@fractaldb/indexing-system/Index.js'

let tree = new BTree<string, number>(undefined, [], 2)

let { describe, expect, run, test } = runner()

// key were using is gonna be a string
// value were using is gonna be a number


describe('can index users by their email', () => {
    // data format: { email: string, id: number, name: string }

    let users = [
        { email: 'albert@example.com', id: 1, name: 'Albert' },
        { email: 'ben@example.com', id: 2, name: 'Ben' },
        { email: 'charlie@example.com', id: 3, name: 'Charlie' },
        { email: 'denis@example.com', id: 4, name: 'Denis' },
        { email: 'elon@example.com', id: 5, name: 'Elon' },
        { email: 'fiona@example.com', id: 6, name: 'Fiona' }
    ]

    // we're going to have an index of users by email
    // so we can use it to find users by email

    test('can find an array of users', async () => {
        for (let user of users) {
            tree.set(user.email, user.id)
        }

        for (let user of users) {
            expect(tree.get(user.email)).toBe(user.id)
        }
    })
})

describe ('can use a property index', async () => {
    let propertyBtree = new BTree<string, ValueIndex<string, any>>()
    let propertyIndex = new PropertyIndex<any>([ 'type' ], propertyBtree, 'entityID')

    await propertyIndex.updateIndex({
        entityID: '1',
        type: 'person',
        name: 'John',
        age: 30
    })

    console.log(propertyIndex.BTree.get('person')?.BTree.get('1'))
})

await run()

`query = {
    organisation: EntityID
    type: 'node'

`