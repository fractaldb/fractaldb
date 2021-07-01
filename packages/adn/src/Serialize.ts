import { ADNExtension, SerializerFN } from './index.js'
import { DataTypes, DataTypeKeys } from './Types.js'

function toPath(paths: string[]) {
    return '›' + paths.join('›')
}

function serializeArray(array: any[], paths: string[], extensions: ADNExtension[]): string {
    return DataTypes.ARRAY
        + array
            .map((val, i) => serializeValue(val, [...paths, i.toString()], extensions))
            .filter(val => val !== undefined)
            .join('')
        + DataTypes.NULLBYTE
}

function serializeObjectKey(key: string, value: any, paths: string[], extensions: ADNExtension[]){
    if(typeof value === 'undefined') return ''
    return serializers['STRING'](key, [...paths, key], extensions) + serializeValue(value, [...paths, key], extensions)
}

function serializeObject(obj: any, paths: string[], extensions: ADNExtension[]): string {
    return DataTypes.OBJECT + Object
        .entries(obj)
        .map(entries => serializeObjectKey(...entries, paths, extensions))
        .join('') + DataTypes.NULLBYTE
}

function serializeMap(value: Map<any, any>, paths: string[], extensions: ADNExtension[]) {
    let str: string = DataTypes.MAP
    let entries = value.entries()

    for ( let [key, value] of entries) {
        if([key, value].includes(undefined)) continue
        str += serializeValue(key, [...paths, `${key}`], extensions) + serializeValue(value, [...paths, `${key}`], extensions)
    }

    return str + DataTypes.NULLBYTE
}

const serializers: { [key in DataTypeKeys]: SerializerFN } = {
    'ARRAY': serializeArray,
    'OBJECT': serializeObject,
    'MAP': serializeMap,
    'SET': () => { throw new Error('Could not serialize: SET') },
    'EOF': () => DataTypes.EOF,
    'FALSE': () => DataTypes.FALSE,
    'TRUE': () => DataTypes.TRUE,
    'NULL': () => DataTypes.NULL,
    'NULLBYTE': () => DataTypes.NULLBYTE,
    'NUMBER': (value: number) => DataTypes.NUMBER + value.toString(16) + DataTypes.NULLBYTE,
    'STRING': (value: string) => DataTypes.STRING + value.replace('\x00', DataTypes.ESCAPECHAR + '\x00') + DataTypes.NULLBYTE,
    'ESCAPECHAR': () => DataTypes.ESCAPECHAR,
    'UNDEFINED': () => '',
    'EXTENSION': () => DataTypes.EXTENSION
}

export default function serialize(value: any, extensions: ADNExtension[]) {
    return serializeValue(value, [], extensions)
}

function getSerializer(value: any, paths: string[], extensions: ADNExtension[]): SerializerFN {
    if(value === false) return serializers['FALSE']
    if(value === true) return serializers['TRUE']
    if(value === null) return serializers['NULL']
    if(value instanceof Map ) return serializers['MAP']
    if(value instanceof Set ) return serializers['SET']
    if(value instanceof Array) return serializers['ARRAY']
    if(typeof value === 'number') return serializers['NUMBER']
    if(typeof value === 'string') return serializers['STRING']
    if(typeof value === 'undefined') return serializers['UNDEFINED']

    let extension = extensions.find(extension => extension.isType(value)) as ADNExtension

    if(extension) return (...args) => DataTypes.EXTENSION + extension.signifier + extension.serialize(...args) + DataTypes.NULLBYTE

    if(typeof value === 'object' && value !== null) return serializers['OBJECT']

    throw new Error(`Could not serialise value ${toPath(paths)}: ${value}`)
}

function serializeValue(value: any, paths: string[], extensions: ADNExtension[]): string {
    return getSerializer(value, paths, extensions)(value, paths, extensions)
}