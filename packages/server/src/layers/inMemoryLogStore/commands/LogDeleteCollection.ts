import { DeleteCollection } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'

export function LogDeleteCollection(logStore: InMemoryLogStore, command: DeleteCollection){
    let [type, database, collection] = command
    logStore.databases.get(database)?.collections.set(collection, null)
}