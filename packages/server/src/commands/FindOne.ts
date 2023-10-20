import { PropertyBTree } from '@fractaldb/indexing-system/indexes/PropertyBTree.js'
import { UniqueBTree } from '@fractaldb/indexing-system/indexes/UniqueBTree.js'
import { FindOne, FindOneResponse } from '@fractaldb/shared/operations/FindOne.js'
import { IndexTypes, ValueTypes } from '@fractaldb/shared/structs/DataTypes.js'
import Transaction from '../layers/transaction/Transaction.js'
import { FindManyCommand } from './FindMany.js'

export type IndexTypeClasses = UniqueBTree | PropertyBTree

export async function FindOneCommand (op: FindOne, tx: Transaction): Promise<FindOneResponse> {
    let findManyResult = await FindManyCommand({
        op: 'FindMany',
        database: op.database,
        collection: op.collection,
        query: op.query,
        limit: 1,
        batchSize: 1,
        closeCursor: true
    }, tx)

    if(findManyResult.nodes.length !== 0) {
        return {
            node: findManyResult.nodes[0]
        }
    }
    return {
        node: null
    }
}