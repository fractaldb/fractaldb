import { ValidSubcollections } from '../interfaces/Options'

export enum Commands {
    DeleteDatabase = 0,
    // x = 1,
    // x = 2,
    DeleteCollection = 3,
    AddRootIndex = 4,
    RemoveRootIndex = 5,
    SetSubcollectionData = 6,
    // x = 7,
    SetPowerOfData = 8,
    // x = 9,
    InitialiseSubcollection = 10,
    IncrementSubcollectionHighestID = 11,
    IncrementPowerHighestID = 12,
    InitialisePower = 13,
}

export type DeleteDatabase = [type: Commands.DeleteDatabase, database: string]
// export type CreateDatabase = [tyoe: Commands.CreateDatabase, database: string]
// export type CreateCollection = [type: Commands.CreateCollection, database: string, collection: string]
export type DeleteCollection = [type: Commands.DeleteCollection, database: string, collection: string]
export type AddRootIndex = [type: Commands.AddRootIndex, database: string, collection: string, index: number]
export type RemoveRootIndex = [type: Commands.RemoveRootIndex, database: string, collection: string, index: number]
export type SetSubcollectionData = [type: Commands.SetSubcollectionData, database: string, collection: string, subcollection: ValidSubcollections, id: number, data: any]
// export type DeleteSubcollectionData = [type: Commands.DeleteSubcollectionData, database: string, collection: string, subcollection: ValidSubcollections, id: number]
export type SetPowerOfData = [type: Commands.SetPowerOfData, database: string, collection: string, subcollection: ValidSubcollections, power: number, id: number, data: any]
// export type DeletePowerOfData = [type: Commands.DeletePowerOfData, database: string, collection: string, subcollection: ValidSubcollections, power: number, id: number]

export type IncrementSubcollectionHighestID = [type: Commands.IncrementSubcollectionHighestID, database: string, collection: string, subcollection: ValidSubcollections]
export type InitialiseSubcollection = [type: Commands.InitialiseSubcollection, database: string, collection: string, subcollection: ValidSubcollections, highestID: number, freeIDs: number[]]
export type IncrementPowerHighestID = [type: Commands.IncrementPowerHighestID, database: string, collection: string, subcollection: ValidSubcollections, power: number]
export type InitialisePower = [type: Commands.InitialisePower, database: string, collection: string, subcollection: ValidSubcollections, power: number, highestID: number, freeIDs: number[]]

export type LogCommand =
    | DeleteDatabase
    // | CreateDatabase
    // | CreateCollection
    | DeleteCollection
    | AddRootIndex
    | RemoveRootIndex
    | SetSubcollectionData
    // | DeleteSubcollectionData
    | SetPowerOfData
    // | DeletePowerOfData
    | InitialiseSubcollection
    | IncrementSubcollectionHighestID
    | IncrementPowerHighestID
    | InitialisePower

