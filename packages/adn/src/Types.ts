// Data ENUM bytes

export enum DataTypes {
    EOF = '',
    NULLBYTE = '\x00',
    OBJECT = '\x01',
    EXTENSION = '\x02',
    STRING = '\x03',
    NUMBER = '\x04',
    TRUE = '\x05',
    FALSE = '\x06',
    MAP = '\x07',
    SET = '\x08',
    NULL = '\x09',
    ARRAY = '\x0a',
    ESCAPECHAR = '\x0b',
    UNDEFINED = '\x0c'
}

export type DataTypeKeys = keyof typeof DataTypes

// Merged tokens

export type Token = ObjectToken
    | ValueToken
    | EOFToken
    | NullByteToken
    | MapToken
    | FalseToken
    | TrueToken
    | NullToken
    | ArrayToken
    | UndefinedToken

export type ValueToken =
    | StringToken
    | NumberToken
    | ExtensionToken

// Tokens

export type MapToken = {
    type: 'MAP'
}

export type ExtensionToken = {
    type: 'EXTENSION'
    value: any
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

export type NumberToken = {
    type: 'NUMBER'
    value: number
}

export type NullToken = {
    type: 'NULL'
}

export type NullByteToken = {
    type: 'NULLBYTE'
}

export type FalseToken = {
    type: 'FALSE'
}

export type TrueToken = {
    type: 'TRUE'
}

export type ArrayToken = {
    type: 'ARRAY'
}

export type UndefinedToken = {
    type: 'UNDEFINED'
}