import { DeleteDatabase } from '../../../logcommands/commands.js'
import InMemoryLogStore from '../InMemoryLogStore.js'

export function LogDeleteDatabase(logStore: InMemoryLogStore, command: DeleteDatabase){
    let [type, database] = command
    logStore.databases.set(database, null)
}