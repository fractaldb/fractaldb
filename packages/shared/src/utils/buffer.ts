

export enum DataTypes {
    EOF = '',
    NULLBYTE = '\x00',
    ESCAPECHAR = '\x01'
}

export function splitBufferStream(cb: (message: string) => void ) {
    let lastStr = ''

    return (data: Buffer) => {
        let str = lastStr + data.toString()
        lastStr = ''
        let start = 0
        let i = 0
        let msg = ''
        
        while (i < str.length ) {
            if(str[i] === DataTypes.EOF) {
                lastStr = str.slice(0, i)
                break
            }
            if(str[i] === DataTypes.ESCAPECHAR) i++
            else if(str[i] === DataTypes.NULLBYTE) {
                cb(msg)
                msg = ''
                start = i + 1
            }

            msg += str[i]

            i++
        }
    }
}