// Data ENUM bytes

import { EntityID } from './EntityID'

export enum DataTypes {
    EOF = '',
    NULLBYTE = '\x00',
    OBJECT = '\x01',
    ENTITYID = '\x02',
    STRING = '\x03',
    NUMBER = '\x04',
    TRUE = '\x05',
    FALSE = '\x06',
    MAP = '\x07',
    SET = '\x08',
    NULL = '\x09',
    ARRAY = '\x0a',
    ESCAPECHAR = '\x0b'
}

export type DataTypeKeys = keyof typeof DataTypes

// Merged tokens

export type Token = ObjectToken
    | ValueToken
    | EOFToken
    | NullByteToken
    | MapToken

export type ValueToken = StringToken
    | NumberToken
    | NullToken
    | EntityIDToken

// Tokens

export type MapToken = {
    type: 'MAP'
}

export type ObjectToken = {
    type: 'OBJECT'
}

export type EOFToken = {
    type: 'EOF'
}
export type StringToken = {
    type: 'STRING'
    value: string
}

export type EntityIDToken = {
    type: 'ENTITYID'
    value: EntityID
}

export type NumberToken = {
    type: 'NUMBER'
    value: number
}

export type NullToken = {
    type: 'NULL',
    value: null
}

export type NullByteToken = {
    type: 'NULLBYTE'
}