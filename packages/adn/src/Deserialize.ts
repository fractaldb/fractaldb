
// need deserialise function for each data type
import { ADNExtension } from './index.js'
import { Tokenizer } from './Tokenizer.js'
import { DataTypeKeys, Token, NumberToken, StringToken, ExtensionToken } from './Types.js'

function deserializeObject(tokenizer: Tokenizer): any {
    let obj: any = {}

    let next = tokenizer.next()
    while(next.type !== 'NULLBYTE'){
        if(next.type == 'STRING') {
            if(['prototype', '__proto__', 'constructor'].includes(next.value)) { // prevent prototype pollution
                throw new Error('Tried to do prototype pollution')
            }
            obj[next.value] = deserializeNextValue(tokenizer)
        } else {
            throw new Error('Tried to serialise an object with a non-string key')
        }
        next = tokenizer.next()
    }

    return obj
}

function deserializeArray(tokenizer: Tokenizer): any[] {
    let arr: any[] = []

    let peek = tokenizer.peek()
    while(peek.type !== 'NULLBYTE'){
        arr.push(deserializeNextValue(tokenizer))
        peek = tokenizer.peek()
    }

    tokenizer.next() // skip NULLBYTE

    return arr
}

function deserializeMap(tokenizer: Tokenizer, value: Token) {
    let entries: [any, any][] = []
    let peek = tokenizer.peek()
    while(peek.type !== 'NULLBYTE') {
        entries.push([deserializeNextValue(tokenizer), deserializeNextValue(tokenizer)])
        peek = tokenizer.peek()
    }

    tokenizer.next() // skip NULLBYTE

    return new Map(entries)
}

const deserializers: { [key in DataTypeKeys]: (tokenizer: Tokenizer, token: Token) => any } = {
    'ARRAY': deserializeArray,
    'OBJECT': deserializeObject,
    'MAP': deserializeMap,
    'SET': () => { throw new Error('Could not deserialize: SET') }, //TODO
    'EOF': () => undefined,
    'UNDEFINED': () => undefined,
    'FALSE': () => false,
    'TRUE': () => true,
    'NULL': () => null,
    'NUMBER': (tokenizer: Tokenizer, token: Token) => (token as NumberToken).value,
    'STRING': (tokenizer: Tokenizer, token: Token) => (token as StringToken).value,
    'NULLBYTE': () => { throw new Error('Cannot deserialize a NULLBYTE') },
    'ESCAPECHAR': () => { throw new Error('Cannot deserialize a ESCAPECHAR') },
    'EXTENSION': (tokenizer, token) => (token as ExtensionToken).value
}

function deserializeNextValue(tokenizer: Tokenizer){
    let next = tokenizer.next()

    let deserializer = deserializers[next.type]

    if(deserializer) return deserializer(tokenizer, next)

    throw new Error(`Could not find a deserialiser for ${next.type}`)
}

/**
 * Deserialise an ADN serialized string
 *
 * @param str ADN serialized string
 */
export default function deserialize(str: string, extensionsMap: {[key: string]: ADNExtension}) {
    let tokenizer = new Tokenizer(str, extensionsMap)

    return deserializeNextValue(tokenizer)
}