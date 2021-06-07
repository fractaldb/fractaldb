import { EntityID } from './EntityID'
import { DataTypes, DataTypeKeys } from './Types'
import { toHex, toHexEscape } from './utils'

function getType (value: any): DataTypeKeys {
    if(value === false) return 'FALSE'
    if(value === true) return 'TRUE'
    if(typeof value === 'number') return 'NUMBER'
    if(typeof value === 'string') return 'STRING'
    if(value === null) return 'NULL'
    if(Array.isArray(value)) return 'ARRAY'
    if(value instanceof EntityID) return 'ENTITYID'
    if(value instanceof Map ) return 'MAP'
    if(value instanceof Set ) return 'SET'

    if(typeof value === 'object' && value !== null) return 'OBJECT'

    throw new Error(`Could not serialise value x${toHex(value)}`)
}

function serializeArray(array: any[]): string {
    return DataTypes.ARRAY + array.map(serializeValue).join('') + DataTypes.NULLBYTE
}

function serialiseObject(obj: any): string {
    return DataTypes.OBJECT + Object
        .entries(obj)
        .map(([key, value]) => serializers['STRING'](key) + serializeValue(value))
        .join('') + DataTypes.NULLBYTE
}

function serializeEntityID(value: EntityID) {
    return DataTypes.ENTITYID + value.toString() + DataTypes.NULLBYTE
}

function serializeMap(value: Map<any, any>) {
    let str: string = DataTypes.MAP
    let entries = value.entries()

    for ( let [key, value] of entries) {
        str += serializeValue(key) + serializeValue(value)
    }

    return str + DataTypes.NULLBYTE
}

const serializers: { [key in DataTypeKeys]: (value: any) => string } = {
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
    return serializeValue(value)
}

function serializeValue(value: any) {
    let type = getType(value)

    let serializer = serializers[type]

    if(serializer) return serializer(value)

    throw new Error('Could not find serializer')
}