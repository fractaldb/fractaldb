import { FractalServer } from '../../database/Server.js'
import MockPower from './MockPower.js'
import InMemoryLogStore from '../inMemoryLogStore/InMemoryLogStore.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import InMemoryLogStoreDatabase from '../inMemoryLogStore/InMemoryLogStoreDatabase.js'
import InMemoryLogStoreCollection from '../inMemoryLogStore/InMemoryLogStoreCollection.js'
import { SubcollectionOpts } from '../../interfaces/Options.js'
import AllocatesIDsInterface from '../../interfaces/AllocatesIDsInterface.js'
import InMemoryLogStoreSubcollection from '../inMemoryLogStore/InMemoryLogStoreSubcollection.js'
import ManagesIDAllocation, { IDInformation } from '../../interfaces/ManagesIDAllocation.js'
import { Commands, IncrementSubcollectionHighestID, InitialiseSubcollection } from '../../logcommands/commands.js'

export type PowerInfo = {
    powers: Map<number, IDInformation>
}

export type SubcollectionInfo = IDInformation & PowerInfo

export default class MockSubcollection<V> extends ManagesIDAllocation implements AllocatesIDsInterface {
    server: FractalServer
    opts: SubcollectionOpts
    powers: Map<number, MockPower<V>> = new Map()

    constructor(server: FractalServer, opts: SubcollectionOpts, subcollectionInfo: SubcollectionInfo) {
        super(subcollectionInfo)
        this.server = server
        this.opts = opts
        for(let [power, powerInfo] of subcollectionInfo.powers) {
            this.powers.set(power, new MockPower(server, {...opts, power}, powerInfo))
        }
    }

    async predicate<X>(cb: (layer?: SubcollectionInterface<V>) => X | Promise<X>, startFrom?: InMemoryLogStore ){
        let log : InMemoryLogStore | undefined = startFrom ?? this.mockLayer.mostRecentLogStore

        while(log) { // there is an older log store, so we need to check it for the same item
            let layer = this.getThisLayer(log)

            if(layer) {
                let result = cb(layer)
                if(result !== undefined) return result
            }

            log = log.older
        }

        throw new Error('Disk layer not yet implemented')
    }

    getOrCreateMockPower(power: number): MockPower<V> {
        let powerClass = this.powers.get(power)
        if (!powerClass) {
            powerClass = new MockPower(this.server, {...this.opts, power}, {
                highestID: 0,
                freeIDs: new Set(),
                usedIDs: new Set()
            })
            this.powers.set(power, powerClass)
        }
        return powerClass
    }

    get mockLayer () {
        return this.server.mockLayer
    }

    async allocateID(): Promise<number> {
        if(this.freeIDs.size === 0) {
            // log the fact that we're incrementing the highest ID, this is considered a write command
            let command: IncrementSubcollectionHighestID = [Commands.IncrementSubcollectionHighestID, this.opts.database, this.opts.collection, this.opts.subcollection]
            await this.mockLayer.mostRecentLogStore.writeCommands([command])

            let id = this.highestID
            this.freeIDs.delete(id) // remove the ID from the freeIDs set
            this.usedIDs.add(id) // add the ID to the usedIDs set
            return id
        } else {
            let id = [...this.freeIDs][0]
            this.freeIDs.delete(id)
            this.usedIDs.add(id)
            return id
        }
    }

    getThisLayer(older: InMemoryLogStore): SubcollectionInterface<V> | undefined{
        return older
            ?.databases.get(this.opts.database)
            ?.collections.get(this.opts.collection)
            ?.[this.opts.subcollection] as unknown as SubcollectionInterface<V> | undefined
    }
}
