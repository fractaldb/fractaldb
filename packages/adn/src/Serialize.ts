import { EntityID } from './EntityID'
import { DataTypes, DataTypeKeys } from './Types'
import { toHex, toHexEscape } from './utils'

function toPath(paths: string[]) {
    return paths.join('/')
}

function getType (value: any, paths: string[]): DataTypeKeys {
    if(value === false) return 'FALSE'
    if(value === true) return 'TRUE'
    if(value === null) return 'NULL'
    if(value instanceof EntityID) return 'ENTITYID'
    if(value instanceof Map ) return 'MAP'
    if(value instanceof Set ) return 'SET'
    if(value instanceof Array) return 'ARRAY'

    if(typeof value === 'number') return 'NUMBER'
    if(typeof value === 'string') return 'STRING'
    if(typeof value === 'object' && value !== null) return 'OBJECT'

    throw new Error(`Could not serialise value ${toPath(paths)}: ${value}`)
}

function serializeArray(array: any[], paths: string[]): string {
    return DataTypes.ARRAY + array.map((val, i) => serializeValue(val, [...paths, i.toString()])).join('') + DataTypes.NULLBYTE
}

function serialiseObject(obj: any, paths: string[]): string {
    return DataTypes.OBJECT + Object
        .entries(obj)
        .map(([key, value]) => serializers['STRING'](key, [...paths, key]) + serializeValue(value, [...paths, key]))
        .join('') + DataTypes.NULLBYTE
}

function serializeEntityID(value: EntityID) {
    return DataTypes.ENTITYID + value.toString() + DataTypes.NULLBYTE
}

function serializeMap(value: Map<any, any>, paths: string[]) {
    let str: string = DataTypes.MAP
    let entries = value.entries()

    for ( let [key, value] of entries) {
        str += serializeValue(key, [...paths, `${key}`]) + serializeValue(value, [...paths, `${key}`])
    }

    return str + DataTypes.NULLBYTE
}

const serializers: { [key in DataTypeKeys]: (value: any, path: string[]) => string } = {
    'ARRAY': serializeArray,
    'OBJECT': serialiseObject,
    'ENTITYID': serializeEntityID,
    'MAP': serializeMap,
    'SET': () => { throw new Error('Could not serialize: SET') },
    'EOF': () => DataTypes.EOF,
    'FALSE': () => DataTypes.FALSE,
    'TRUE': () => DataTypes.TRUE,
    'NULL': () => DataTypes.NULL,
    'NULLBYTE': () => DataTypes.NULLBYTE,
    'NUMBER': (value: number) => DataTypes.NUMBER + value.toString(16) + DataTypes.NULLBYTE,
    'STRING': (value: string) => DataTypes.STRING + value.replace('\x00', DataTypes.ESCAPECHAR + '\x00') + DataTypes.NULLBYTE,
    'ESCAPECHAR': () => DataTypes.ESCAPECHAR
}

export default function serialize(value: any) {
    return serializeValue(value, ['/'])
}

function serializeValue(value: any, path: string[]) {
    let type = getType(value, path)

    let serializer = serializers[type]

    if(serializer) return serializer(value, path)

    throw new Error('Could not find serializer')
}