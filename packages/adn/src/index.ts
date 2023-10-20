import deserialize from './Deserialize.js'
import serialize from './Serialize.js'
import { Tokenizer } from './Tokenizer.js'

type ADNExtensionMap = { [key: string]: ADNExtension }

export class ADN {
    extensions: ADNExtension[]
    extensionsMap: ADNExtensionMap
    constructor(handlers: ADNExtension[]){
        this.extensions = handlers
        this.extensionsMap = handlers.reduce((map, extension) => ({
            ...map,
            [extension.signifier]: extension
        }), {} as ADNExtensionMap)
    }

    deserialize(str: string) {
        return deserialize(str, this.extensionsMap)
    }

    serialize(val: any) {
        return serialize(val, this.extensions)
    }
}

export type SerializerFN = (value: any, path: string[], extensions: ADNExtension[]) => string

export abstract class ADNExtension {
    signifier: string

    constructor(signifier: string){
        this.signifier = signifier
    }

    abstract isType(val: any): boolean
    abstract serialize(val: any, path: string[], extensions: ADNExtension[]): string
    abstract deserialize(tokenizer: Tokenizer, value: any): any
}