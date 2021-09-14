
export default class Deferred<V> {
    promise: Promise<V>
    resolve!: (value?: V) => void
    reject!: (reason?: any) => void
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve as any
            this.reject = reject as any
        })
    }
}