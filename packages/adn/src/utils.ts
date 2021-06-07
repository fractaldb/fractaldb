export function toHex(str: string) {
    var result = ''
    for (var i = 0; i < str.length; i++) {
        let hex = str.charCodeAt(i).toString(16)
        if(hex.length < 2) {
            hex = '0' + hex
        }
        result += hex
    }
    return result
}

export function fromHex(str: string) {
    return unescape(str.replace(/\\/g, '%'))
}

export function toHexEscape(str: string){
    var result = ''
    for (var i = 0; i < str.length; i++) {
        let hex = str.charCodeAt(i).toString(16)
        if(hex.length < 2) {
            hex = '0' + hex
        }
        result += '\\x' + hex
    }
    return result
}