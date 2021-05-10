
export function splitBufferStream(cb: (message: string) => void ) {
    let lastStr = ''

    return (data: Buffer) => {
        let i = 0
        
        let strs = data.toString().split('\x00')
        strs[0] = lastStr + strs[0]
        lastStr = strs.pop() as string

        let len = strs.length
    
        while(i < len) {
            let str = strs[i]
            
            cb(str)

            i++
        }


        // while(true) {
        //     i = data.indexOf(0, start)
        //     if(i === -1) {
        //         lastStr = data.slice(start, data.length).toString()
        //         break
        //     }

        //     let str = lastStr + data.slice(start, i).toString()
        //     lastStr = ''
        //     cb(str)
        //     start = i + 1
        // }

        // while(i < data.length){ // ensures the socket stream is split on any null bytes, signifiying the start of a new message
        //     if(data[i] === 0){
        //         let str = start === 0 ? lastStr : ''
        //         str += data.slice(start, i).toString()
        //         cb(str)
        //         start = i + 1
        //     }
        //     i++
        //     if(i === data.length) {
        //         lastStr = data.slice(start, i).toString()
        //     }
        // }
    }
}