import { AbortTransaction, AbortTransactionResponse } from './AbortTransaction.js'
import { CommitTransaction, CommitTransactionResponse } from './CommitTransaction.js'
import { Count, CountResponse } from './Count.js'
import { DeleteMany, DeleteManyResponse } from './DeleteMany.js'
import { DeleteOne, DeleteOneResponse } from './DeleteOne.js'
import { FindMany, FindManyResponse, FindManyMore, FindManyMoreResponse } from './FindMany.js'
import { FindOne, FindOneResponse } from './FindOne.js'
import { InsertMany, InsertManyResponse } from './InsertMany.js'
import { InsertOne, InsertOneResponse } from './InsertOne.js'
import { StartTransaction, StartTransactionResponse } from './StartTransaction.js'
import { UpdateMany, UpdateManyResponse } from './UpdateMany.js'
import { UpdateOne, UpdateOneResponse } from './UpdateOne.js'


// export type {
//     AbortTransaction,
//     CommitTransaction,
//     StartTransaction,
//     Count,
//     DeleteOne,
//     DeleteMany,
//     FindOne,
//     FindMany,
//     InsertOne,
//     InsertMany,
//     UpdateOne,
//     UpdateMany
// }

export type Operation =
    | AbortTransaction
    | CommitTransaction
    | StartTransaction
    | Count
    | DeleteOne
    | DeleteMany
    | FindOne
    | FindMany
    | InsertOne
    | InsertMany
    | UpdateOne
    | UpdateMany

export type RequestOperation = Operation & { requestID: string }
    // | FindManyMore

export type OperationResponse =
    | AbortTransactionResponse
    | CommitTransactionResponse
    | StartTransactionResponse
    | CountResponse
    | DeleteOneResponse
    | DeleteManyResponse
    | FindOneResponse
    | FindManyResponse
    | FindManyMoreResponse
    | InsertOneResponse
    | InsertManyResponse
    | UpdateOneResponse
    | UpdateManyResponse