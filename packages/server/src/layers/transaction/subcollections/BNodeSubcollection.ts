import { Commands, DeleteBNode, SetBNode } from '../../../logcommands/commands'
import { BNodeData } from '../../../structures/Subcollection'
import TransactionSubcollection from '../TransactionSubcollection'

export default class BNodeSubcollection extends TransactionSubcollection<BNodeData> {

    getWrites(): (SetBNode|DeleteBNode)[] {
        let writes:(SetBNode|DeleteBNode)[] = []
        for (let [id, data] of this.items) {
            if(data === null) {
                writes.push([
                    Commands.DeleteBNode,
                    this.subcollectionManager.db,
                    this.subcollectionManager.collection,
                    id
                ])
            }
}