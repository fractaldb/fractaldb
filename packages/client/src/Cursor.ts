// import Session from './Session'

export default class Cursor {

    // session: Session
    cursorState: CursorState

    constructor(){

        // this.session = 
        this.cursorState = new CursorState()
    }

    async toArray() {
        let docs = []

        while(this.hasNext()){
            let doc = this.next()

            docs.push(doc)
        }
    }

    async hasNext() {

    }

    async next() {

    }
}

class CursorState {
    documents: any[] = []
    batchSize: number = 20
    prefetchDocs: any[] = []
    cursorIndex: number = 0
    
    constructor() {

    }
}