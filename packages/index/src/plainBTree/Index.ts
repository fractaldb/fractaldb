import BTree from './BTree.js'

export class ValueIndex<K, V> {
    BTree: BTree<K, V>
    subindexes: PropertyIndex<any>[]

    constructor(BTree: BTree<K, V>) {
        this.BTree = BTree
        this.subindexes = []
    }

    async updateIndex(key: K, value: V): Promise<void> {
        await this.BTree.set(key, value)

        for (let subindex of this.subindexes) {
            await subindex.updateIndex(value)
        }
    }

}

export class PropertyIndex<V> {
    propertyPath: string[]
    BTree: BTree<string, ValueIndex<string, V>>
    valueProp: string

    constructor(propertyPath: string[], BTree: BTree<string, ValueIndex<string, V>>, valueProp: string){
        this.propertyPath = propertyPath
        this.BTree = BTree
        this.valueProp = valueProp
    }

    // check if a given value should belong in this index
    // check if each property in the paths is a property of value
    shouldAddToIndex(value: V): boolean {
        let i = 0
        let currentValue: any = value
        while(i < this.propertyPath.length) {
            let prop = this.propertyPath[i]

            if(!currentValue) break

            if(prop in currentValue) {
                if(i === this.propertyPath.length - 1) {
                    return true
                } else {
                    currentValue = currentValue[prop]
                    i++
                    continue
                }
            }
            break
        }
        return false
    }

    async updateIndex(value: V): Promise<void> {
        if(this.shouldAddToIndex(value)) {
            let key = this.propertyPath.slice(-1)[0]
            let alreadyExists = await this.BTree.has(key)
            let keyValue = (value as any)[key]
            if(!alreadyExists) {
                await this.BTree.set(keyValue, new ValueIndex<string, V>(new BTree<string, V>()))
            }

            let index = await this.BTree.get(keyValue) as ValueIndex<string, V>
            await index.updateIndex((value as any)[this.valueProp], value)
        }
    }
}
