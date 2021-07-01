import { ADNExtension } from 'src'
import { EntityID } from './EntityID.js'
import { InputStream } from './InputStream.js'
import { Token, DataTypes, ExtensionToken } from './Types.js'

export function is_not_nullbyte(ch: string): boolean {
    return ch !== DataTypes.NULLBYTE
}

export class Tokenizer {
    inputStream: InputStream
    current?: Token
    extensions: {[key: string]: ADNExtension}

    constructor(input: string, extensions: {[key: string]: ADNExtension}) {
        this.inputStream = new InputStream(input)
        this.extensions = extensions
    }

    read_until(predicate: (ch: string) => boolean) {
        var str = ''
        while (!this.inputStream.eof()) {
            if(this.inputStream.peek() === DataTypes.ESCAPECHAR) this.inputStream.pos++
            else if(!predicate(this.inputStream.peek())) break

            str += this.inputStream.next()
        }
        this.inputStream.next() // ignore the final predicate
        return str
    }

    read_next(): Token {
        let inputStream = this.inputStream

        let ch = inputStream.next()
        switch (ch) {
            case DataTypes.STRING: return {
                type: 'STRING',
                value: this.read_until(is_not_nullbyte)
            }

            case DataTypes.EXTENSION: return {
                type: 'EXTENSION',
                value: this.extensions[inputStream.peek()].deserialize(this, inputStream.next())
            }

            case DataTypes.NUMBER: return {
                type: 'NUMBER',
                value: parseInt(this.read_until(is_not_nullbyte), 16)
            }

            case DataTypes.OBJECT: return { type: 'OBJECT' }
            case DataTypes.NULLBYTE: return { type: 'NULLBYTE' }
            case DataTypes.ARRAY: return { type: 'ARRAY' }
            case DataTypes.MAP: return { type: 'MAP' }
            case DataTypes.EOF: return { type: 'EOF' }
            case DataTypes.FALSE: return { type: 'FALSE' }
            case DataTypes.TRUE: return { type: 'TRUE' }
            case DataTypes.NULL: return { type: 'NULL' }
            default:
                throw new Error(`This should never be reached: ${ch}`)
        }
    }

    peek() {
        return this.current || (this.current = this.read_next())
    }
    next() {
        var tok = this.current
        this.current = undefined
        return tok || this.read_next()
    }

    eof() {
        return this.peek().type === 'EOF'
    }
}