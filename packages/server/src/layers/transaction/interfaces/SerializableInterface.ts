// TODO
type Command = {}

export interface SerializableInterface {
    toCommands(): Command[]
    // abort, commit, release locks, final etc
}
