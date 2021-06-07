import { DataTypes } from './Types'


class InputError extends Error {
    // generate a pretty error that shows where in the type definitions the error ocurred
    constructor(msg: string, src: string, line: number, col: number) {
        let srcLines = src.split('\n')

        let relevantLines = [line - 3, line - 2, line - 1, line]
            .filter(line => line > 0)

        let lines = relevantLines.map(line => `${line}: ${srcLines[line - 1]}`)

        let colLine = new Array(col + line.toString().length + 2).fill(' ')
        colLine[col + line.toString().length + 1] = '^'

        lines.splice(lines.length, 0, colLine.join(''))

        let message = `${msg} (line: ${line}, col: ${col})\n\n` + lines.join('\n') + `\n`

        super(message)
    }
}

/**
 * Convert an string input into a character traverser
 */
export class InputStream {
    pos: number
    input: string

    constructor(input: string) {
        this.input = input
        this.pos = 0
    }

    /**
     * Get next character in string
     */
    next() {
        return this.input.charAt(this.pos++)
    }

    /**
     * Look at next character without increasing index
     */
    peek() {
        return this.input.charAt(this.pos)
    }

    /**
     * returns true if no more characters in string
     */
    eof() {
        return this.peek() == ''
    }

    /**
     * @param msg Message of error to throw
     */
    croak(msg: string): never {
        throw new Error(msg)
    }
}
