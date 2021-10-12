// import { AbortTransaction, AbortTransactionResponse } from './AbortTransaction.js'
// import { CommitTransaction, CommitTransactionResponse } from './CommitTransaction.js'
// import { Count, CountResponse } from './Count.js'
import { CreateNode, CreateNodeResponse } from './CreateNode.js'
import { DeleteNode, DeleteNodeResponse } from './DeleteNode.js'
import { EnsureRootIndex, EnsureRootIndexResponse } from './EnsureRootIndex.js'
import { IndexGet } from './IndexGet.js'
import { IndexSet, IndexSetResponse } from './IndexSet'
// import { DeleteMany, DeleteManyResponse } from './DeleteMany.js'
// import { DeleteOne, DeleteOneResponse } from './DeleteOne.js'
import { FindMany, FindManyResponse, FindManyMore, FindManyMoreResponse } from './FindMany.js'
import { FindOne, FindOneResponse } from './FindOne.js'
// import { InsertMany, InsertManyResponse } from './InsertMany.js'
// import { InsertOne, InsertOneResponse } from './InsertOne.js'
// import { StartTransaction, StartTransactionResponse } from './StartTransaction.js'
// import { UpdateMany, UpdateManyResponse } from './UpdateMany.js'
// import { UpdateOne, UpdateOneResponse } from './UpdateOne.js'

export type Operation =
    | CreateNode
    | DeleteNode
    | EnsureRootIndex
    | IndexSet
    | IndexGet
    // | AbortTransaction
    // | CommitTransaction
    // | StartTransaction
    // | Count
    // | DeleteOne
    // | DeleteMany
    | FindOne
    | FindMany
    // | InsertOne
    // | InsertMany
    // | UpdateOne
    // | UpdateMany
    // | FindManyMore

export type RequestOperation = Operation & { requestID: string }


export type OperationResponse =
    | CreateNodeResponse
    | DeleteNodeResponse
    | EnsureRootIndexResponse
    | IndexSetResponse
    | IndexGet
    // | AbortTransactionResponse
    // | CommitTransactionResponse
    // | StartTransactionResponse
    // | CountResponse
    // | DeleteOneResponse
    // | DeleteManyResponse
    | FindOneResponse
    | FindManyResponse
    // | FindManyMoreResponse
    // | InsertOneResponse
    // | InsertManyResponse
    // | UpdateOneResponse
    // | UpdateManyResponse