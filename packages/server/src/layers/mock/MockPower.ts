import { FractalServer } from '../../database/Server.js'
import AllocatesIDsInterface from '../../interfaces/AllocatesIDsInterface.js'
import ManagesIDAllocation from '../../interfaces/ManagesIDAllocation.js'
import { PowerOpts } from '../../interfaces/Options.js'
import PowerInterface from '../../interfaces/PowerInterface.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import { Commands, IncrementPowerHighestID, InitialisePower } from '../../logcommands/commands.js'
import InMemoryLogStore from '../inMemoryLogStore/InMemoryLogStore.js'
import InMemoryLogStoreCollection from '../inMemoryLogStore/InMemoryLogStoreCollection.js'
import InMemoryLogStoreDatabase from '../inMemoryLogStore/InMemoryLogStoreDatabase.js'
import InMemoryLogStorePower from '../inMemoryLogStore/InMemoryLogStorePower.js'
import InMemoryLogStoreSubcollection from '../inMemoryLogStore/InMemoryLogStoreSubcollection.js'

export default class MockPower<V> implements AllocatesIDsInterface {
    server: FractalServer
    opts: PowerOpts

    constructor(server: FractalServer, opts: PowerOpts) {
        this.server = server
        this.opts = opts
    }

    predicate<X>(cb: (layer?: PowerInterface<V>) => X, startFrom?: InMemoryLogStore ){
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

    get mockLayer () {
        return this.server.mockLayer
    }

    async getOrInitialisePowerInMostRecentLogStore(): Promise<InMemoryLogStorePower<V>> {
        let log = this.mockLayer.mostRecentLogStore

        let db = log.databases.get(this.opts.database)
        if (!db) {
            db = new InMemoryLogStoreDatabase(log, { database: this.opts.database })
            log.databases.set(this.opts.database, db)
        }
        let collection = db.collections.get(this.opts.collection)
        if (!collection) {
            collection = new InMemoryLogStoreCollection(log, { database: this.opts.database, collection: this.opts.collection })
            db.collections.set(this.opts.collection, collection)
        }
        let subcollection = collection[this.opts.subcollection] as unknown as InMemoryLogStoreSubcollection<V>
        let power = subcollection.powers.get(this.opts.power)
        if(!power) {
            power = new InMemoryLogStorePower(log, { database: this.opts.database, collection: this.opts.collection, subcollection: this.opts.subcollection, power: this.opts.power })
            subcollection.powers.set(this.opts.power, power)
        }
        if(!power.initialised) {
            let nextMostRecent = log.older ? this.predicate<ManagesIDAllocation | undefined>(layer => layer instanceof ManagesIDAllocation ? layer : undefined, log.older) : undefined
            if(nextMostRecent) { // initialise based on last known values
                power.freeIDs = new Set(nextMostRecent.freeIDs)
                power.usedIDs = new Set(nextMostRecent.usedIDs)
                power.highestID = nextMostRecent.highestID
            } // else just use the defaults
            let command: InitialisePower = [Commands.InitialisePower, this.opts.database, this.opts.collection, this.opts.subcollection, this.opts.power, subcollection.highestID, [...subcollection.freeIDs, ...subcollection.usedIDs]]
            log.applyTxCommands([command])
            power.initialised = true
        }
        return power
    }

    // async get(id: number): Promise<V | null> {
    //     let log : InMemoryLogStore | undefined = this.mockLayer.mostRecentLogStore

    //     while(log) { // there is an older log store, so we need to check it for the same item
    //         let value = ((log
    //             ?.databases.get(this.opts.database)
    //             ?.collections.get(this.opts.collection) as any)
    //             ?.[this.opts.subcollection] as InMemoryLogStoreSubcollection<V>)
    //             ?.powers.get(this.opts.power)
    //             ?.items.get(id)

    //         if(value !== undefined) return value
    //         log = log.older
    //     }

    //     throw new Error('Disk layer not yet implemented')
    // }

    async allocateID(): Promise<number> {
        let latest = await this.getOrInitialisePowerInMostRecentLogStore()

        if(latest.freeIDs.size === 0) {
            // log the fact that we're incrementing the highest ID, this is considered a write command
            let command: IncrementPowerHighestID = [Commands.IncrementPowerHighestID, this.opts.database, this.opts.collection, this.opts.subcollection, this.opts.power]
            await this.mockLayer.mostRecentLogStore.applyTxCommands([command])
            let id = ++latest.highestID
            latest.usedIDs.add(id)
            return id
        } else {
            let id = [...latest.freeIDs][0]
            latest.freeIDs.delete(id)
            latest.usedIDs.add(id)
            return id
        }
    }

    getThisLayer(older: InMemoryLogStore) {
        return ((older
            ?.databases.get(this.opts.database)
            ?.collections.get(this.opts.collection) as any)
            ?.[this.opts.subcollection] as SubcollectionInterface<V>)
            ?.powers.get(this.opts.power) as PowerInterface<V> | undefined
    }
}