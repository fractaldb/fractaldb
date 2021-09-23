import { FractalServer } from '../../database/Server.js'
import AllocatesIDsInterface from '../../interfaces/AllocatesIDsInterface.js'
import { PowerOpts } from '../../interfaces/Options.js'
import PowerInterface from '../../interfaces/PowerInterface.js'
import { SubcollectionInterface } from '../../interfaces/SubcollectionInterface.js'
import InMemoryLogStore from '../inMemoryLogStore/InMemoryLogStore.js'

export default class MockPower<V> implements AllocatesIDsInterface {
    server: FractalServer
    opts: PowerOpts

    constructor(server: FractalServer, opts: PowerOpts) {
        this.server = server
        this.opts = opts
    }

    predicate<X>(cb: (layer?: PowerInterface<V>) => X){
        let log : InMemoryLogStore | undefined = this.mockLayer.mostRecentLogStore

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
        throw new Error('Not yet implemented')
    }

    getThisLayer(older: InMemoryLogStore) {
        return ((older
            ?.databases.get(this.opts.database)
            ?.collections.get(this.opts.collection) as any)
            ?.[this.opts.subcollection] as SubcollectionInterface<V>)
            ?.powers.get(this.opts.power) as PowerInterface<V> | undefined
    }
}