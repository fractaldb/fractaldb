import { DataTypes } from '@fractaldb/adn/Types.js'

export function splitBufferStream(cb: (message: string) => void ) {
    let lastStr = ''

    return (data: Buffer) => {
        let str = lastStr + data.toString()
        lastStr = ''
        let start = 0
        let i = 0
        let msg = ''

        while (i < str.length ) {
            if(str[i] === DataTypes.ESCAPECHAR) {
                i++
            } else if(str[i] === DataTypes.NULLBYTE) {
                cb(msg)
                msg = ''
                i++ // skip separator byte)
                start = i
                continue
            }

            msg += str[i]

            i++
        }

        lastStr = str.slice(start, i)
    }
}