import { ClientSession } from '../Session'

export type OperationOptions = {
    session?: ClientSession
}

export default abstract class OperationBase {
    session?: ClientSession

    constructor(options: OperationOptions){
        this.session = options.session
    }

    clearSession(){
        delete this.session
    }
}