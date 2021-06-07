import { EntityID } from './EntityID'
import { InputStream } from './InputStream'
import { NumberToken, StringToken, ObjectToken, Token, DataTypes, EntityIDToken } from './Types'

export class Tokenizer {
    inputStream: InputStream
    current?: Token

    constructor(input: string) {
        this.inputStream = new InputStream(input)
    }

    read_next(): Token {
        let inputStream = this.inputStream

        function read_until(predicate: (ch: string) => boolean) {
            var str = ''
            while (!inputStream.eof()) {
                if(inputStream.peek() === DataTypes.ESCAPECHAR) inputStream.pos++
                else if(!predicate(inputStream.peek())) break

                str += inputStream.next()
            }
            inputStream.next() // ignore the final predicate
            return str
        }

        function is_not_nullbyte(ch: string): boolean {
            return ch !== DataTypes.NULLBYTE
        }

        function readObject(): ObjectToken {
            return {
                type: 'OBJECT'
            }
        }

        function readString(): StringToken {
            return {
                type: 'STRING',
                value: read_until(is_not_nullbyte)
            }
        }

        function readEntityID(): EntityIDToken {
            return {
                type: 'ENTITYID',
                value: new EntityID(read_until(is_not_nullbyte))
            }
        }

        function readNumber(): NumberToken {
            return {
                type: 'NUMBER',
                value: parseInt(read_until(is_not_nullbyte), 16)
            }
        }


        let ch = inputStream.next()
        switch (ch) {
            case DataTypes.OBJECT: return readObject()
            case DataTypes.STRING: return readString()
            case DataTypes.ENTITYID: return readEntityID()
            case DataTypes.NULLBYTE: return { type: 'NULLBYTE' }
            case DataTypes.NUMBER: return readNumber()
            case DataTypes.MAP: return { type: 'MAP' }
            case DataTypes.EOF: return { type: 'EOF' }
            default:
                throw new Error('This should never be reached')
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