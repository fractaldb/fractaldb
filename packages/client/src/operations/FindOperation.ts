import { FractalClient } from '../Client'
import Collection from '../Collection'
import { FractalNamespace } from '../utils'
import OperationBase, { OperationOptions } from './OperationBase'

export type FindCommand = {
    projection?: any
    skip?: number
    limit?: number
    sort?: -1 | 1
}

export default class FindOperation extends OperationBase {
    namespace: FractalNamespace
    command: FindCommand
    client?: FractalClient

    constructor(namespace: FractalNamespace, command: FindCommand, options: OperationOptions){
        super(options)
        this.namespace = namespace
        this.command = command
    }

    execute(client: FractalClient){
        this.client = client

        // client.query(this.namespace.toString(), this.command, this.session)
    }
}