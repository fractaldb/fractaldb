import { AbortTransaction, AbortTransactionResponse } from './AbortTransaction'
import { CommitTransaction, CommitTransactionResponse } from './CommitTransaction'
import { Count, CountResponse } from './Count'
import { DeleteMany, DeleteManyResponse } from './DeleteMany'
import { DeleteOne, DeleteOneResponse } from './DeleteOne'
import { FindMany, FindManyResponse, FindManyMore, FindManyMoreResponse } from './FindMany'
import { FindOne, FindOneResponse } from './FindOne'
import { InsertMany, InsertManyResponse } from './InsertMany'
import { InsertOne, InsertOneResponse } from './InsertOne'
import { StartTransaction, StartTransactionResponse } from './StartTransaction'
import { UpdateMany, UpdateManyResponse } from './UpdateMany'
import { UpdateOne, UpdateOneResponse } from './UpdateOne'


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