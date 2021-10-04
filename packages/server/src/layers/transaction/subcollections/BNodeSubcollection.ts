// import { Commands, DeleteBNode, SetBNode } from '../../../logcommands/commands.js'
// import { BNodeData } from '../../../structures/Subcollection.js'
// import TransactionSubcollection from '../TransactionSubcollection.js'

// export default class BNodeSubcollection extends TransactionSubcollection<BNodeData> {

//     getWrites(): (SetBNode|DeleteBNode)[] {
//         let writes:(SetBNode|DeleteBNode)[] = []
//         for (let [id, data] of this.items) {
//             if(data === null) {
//                 writes.push([
//                     Commands.DeleteBNode,
//                     this.subcollectionManager.db,
//                     this.subcollectionManager.collection,
//                     id
//                 ])
//             }
// }