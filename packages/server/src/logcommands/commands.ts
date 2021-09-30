import { ValidSubcollections } from '../interfaces/Options'

export enum Commands {
    DeleteDatabase = 0,
    CreateDatabase = 1,
    CreateCollection = 2,
    DeleteCollection = 3,
    CreatePowerOfCollection = 4,
    DeletePowerOfCollection = 5,
    SetSubcollectionData = 6,
    DeleteSubcollectionData = 7,
    SetPowerOfData = 8,
    DeletePowerOfData = 9,
    InitialiseSubcollection = 10,
    IncrementSubcollectionHighestID = 11,
    IncrementPowerHighestID = 12,
    InitialisePower = 13,
}

export type DeleteDatabase = [type: Commands.DeleteDatabase, database: string]
export type CreateDatabase = [tyoe: Commands.CreateDatabase, database: string]
export type CreateCollection = [type: Commands.CreateCollection, database: string, collection: string]
export type DeleteCollection = [type: Commands.DeleteCollection, database: string, collection: string]
export type CreatePowerOfCollection = [type: Commands.CreatePowerOfCollection, database: string, collection: string, subcollection: ValidSubcollections, power: number]
export type DeletePowerOfCollection = [type: Commands.DeletePowerOfCollection, database: string, collection: string, subcollection: ValidSubcollections, power: number]
export type SetSubcollectionData = [type: Commands.SetSubcollectionData, database: string, collection: string, subcollection: ValidSubcollections, id: number, data: any]
export type DeleteSubcollectionData = [type: Commands.DeleteSubcollectionData, database: string, collection: string, subcollection: ValidSubcollections, id: number]
export type SetPowerOfData = [type: Commands.SetPowerOfData, database: string, collection: string, subcollection: ValidSubcollections, power: number, id: number, data: any]
export type DeletePowerOfData = [type: Commands.DeletePowerOfData, database: string, collection: string, subcollection: ValidSubcollections, power: number, id: number]

export type IncrementSubcollectionHighestID = [type: Commands.IncrementSubcollectionHighestID, database: string, collection: string, subcollection: ValidSubcollections]
export type InitialiseSubcollection = [type: Commands.InitialiseSubcollection, database: string, collection: string, subcollection: ValidSubcollections, highestID: number, freeIDs: number[]]
export type IncrementPowerHighestID = [type: Commands.IncrementPowerHighestID, database: string, collection: string, subcollection: ValidSubcollections, power: number]
export type InitialisePower = [type: Commands.InitialisePower, database: string, collection: string, subcollection: ValidSubcollections, power: number, highestID: number, freeIDs: number[]]

export type LogCommand =
    | DeleteDatabase
    | CreateDatabase
    | CreateCollection
    | DeleteCollection
    | CreatePowerOfCollection
    | DeletePowerOfCollection
    | SetSubcollectionData
    | DeleteSubcollectionData
    | SetPowerOfData
    | DeletePowerOfData
    | InitialiseSubcollection
    | IncrementSubcollectionHighestID
    | IncrementPowerHighestID
    | InitialisePower

