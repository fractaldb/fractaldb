import { FractalServer } from '../../database/Server.js'
import AllocatesIDsInterface from '../../interfaces/AllocatesIDsInterface.js'
import ManagesIDAllocation, { IDInformation } from '../../interfaces/ManagesIDAllocation.js'
import { PowerOpts } from '../../interfaces/Options.js'
import PowerInterface from '../../interfaces/PowerInterface.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import { Commands, IncrementPowerHighestID, InitialisePower } from '../../logcommands/commands.js'
import InMemoryLogStore from '../inMemoryLogStore/InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../inMemoryLogStore/InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../inMemoryLogStore/InMemoryLogStoreDatabase.js'
import InMemoryLogStorePower from '../inMemoryLogStore/InMemoryLogStorePower.js'
import InMemoryLogStoreSubcollection from '../inMemoryLogStore/InMemoryLogStoreSubcollection.js'

export default class MockPower<V> extends ManagesIDAllocation implements AllocatesIDsInterface {
    server: FractalServer
    opts: PowerOpts

    constructor(server: FractalServer, opts: PowerOpts, IDInformation: IDInformation) {
        super(IDInformation)
        this.server = server
        this.opts = opts
    }

    async predicate<X>(cb: (layer?: PowerInterface<V>) => X | Promise<X>, startFrom?: InMemoryLogStore ): Promise<X | undefined> {
        let log : InMemoryLogStore | undefined = startFrom ?? this.mockLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let layer = this.getThisLayer(log)
            if(layer) {
                let result = await cb(layer)
                // if result is null, then it has been deleted, so we return that
                if(result !== undefined) return result
                // value is undefined, so we need to check the next log store
            }

            log = log.older
        }

        return

        throw new Error('Disk layer not yet implemented')
    }

    get mockLayer () {
        return this.server.mockLayer
    }

    async allocateID(): Promise<number> {
        if(this.freeIDs.size === 0) {
            // log the fact that we're incrementing the highest ID, this is considered a write command
            let command: IncrementPowerHighestID = [Commands.IncrementPowerHighestID, this.opts.database, this.opts.collection, this.opts.subcollection, this.opts.power]
            await this.mockLayer.mostRecentLogStore.writeCommands([command])

            let id = this.highestID
            this.freeIDs.delete(id) // remove the ID from the freeIDs set
            this.usedIDs.add(id) // add the ID to the usedIDs set
            return id
        } else {
            let id = [...this.freeIDs][0] // get the first free ID
            this.freeIDs.delete(id) // remove it from the free IDs
            this.usedIDs.add(id) // add it to the used IDs
            return id
        }
    }

    getThisLayer(older: InMemoryLogStore): PowerInterface<V> | undefined {
        return older
            ?.databases.get(this.opts.database)
            ?.collections.get(this.opts.collection)
            ?.[this.opts.subcollection]
            ?.powers.get(this.opts.power)
    }
}