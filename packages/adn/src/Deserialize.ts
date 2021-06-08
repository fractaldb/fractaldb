
// need deserialise function for each data type
import { Tokenizer } from './Tokenizer'
import { DataTypeKeys, Token, NumberToken, StringToken, EntityIDToken } from './Types'

function deserializeObject(tokenizer: Tokenizer): any {
    let obj: any = Object.create(null) // prevent prototype pollution
    Object.freeze(obj.prototype) // prevent prototype pollution


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

    let next = tokenizer.next()
    while(next.type !== 'NULLBYTE'){
        arr.push(deserializeNextValue(tokenizer))
        next = tokenizer.next()
    }

    return arr
}

function deserializeEntityID (tokenizer: Tokenizer, value: Token) {
    return (value as EntityIDToken).value
}

function deserializeMap(tokenizer: Tokenizer, value: Token) {
    let entries: [any, any][] = []
    let peek = tokenizer.peek()
    while(peek.type !== 'NULLBYTE') {
        entries.push([deserializeNextValue(tokenizer), deserializeNextValue(tokenizer)])
        peek = tokenizer.peek()
    }

    return new Map(entries)
}

const deserializers: { [key in DataTypeKeys]: (tokenizer: Tokenizer, value: Token) => any } = {
    'ARRAY': deserializeArray,
    'OBJECT': deserializeObject,
    'ENTITYID': deserializeEntityID,
    'MAP': deserializeMap,
    'SET': () => { throw new Error('Could not serialize: SET') }, //TODO
    'EOF': () => { throw new Error('Could not serialize: EOF') }, //TODO
    'FALSE': () => false,
    'TRUE': () => true,
    'NULL': () => null,
    'NUMBER': (tokenizer: Tokenizer, value: Token) => (value as NumberToken).value,
    'STRING': (tokenizer: Tokenizer, value: Token) => (value as StringToken).value,
    'NULLBYTE': () => { throw new Error('Cannot deserialise a NULLBYTE') },
    'ESCAPECHAR': () => { throw new Error('Cannot deserialise a ESCAPECHAR') },
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
export default function deserialize(str: string) {
    let tokenizer = new Tokenizer(str)
    
    return deserializeNextValue(tokenizer)
}