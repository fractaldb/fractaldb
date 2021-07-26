
/**
 * Database collection
 */
class Collection {
    rootIndexes: Index[]
}

let user = {
    type: 'user',
    email: 'albert@insanemarketing.com.au'
}



// find all the root indexes
// addToIndexes(rootIndexes, doc)
// function addToIndexes(indexes, doc)
    // for each index, check if the property of the index exists in the doc
     // if it does exist, then add the doc to the index
        // get all subindexes
            // addToIndexes(subindexes, doc)

type Entity = {
    [key: string]: any
}

function addToIndexes(indexes: Index[], doc: Entity){
    let i = 0
    while(i < indexes.length){
        let index = indexes[i]

        //check if property exists in doc
        if(doc[index.property] !== undefined){
            //add doc to index
            index.insert(doc[index.property], doc.entityID.internalID)
            // get all subindexes
            let subindexes = index.subindexes
            addToIndexes(subindexes, doc)
        }
        i++
    }
}

class Index<K,T>{
    subindexes: Index[]
    root: BTreeNode
    property: string

    constructor(property: string, subindexes: Index<any, any>[], root: BTreeNode){
        this.subindexes = subindexes
        this.property = property
        this.root = root
    }
}

let index = new Index('type', [], new BTreeNode(0))
index.insert('user', new Index('user', [new Index('email', [], new BTreeNode(0))], new BTreeNode(0)))


// get all the root indexes
// let rootIndexes = getRootIndexes(indexes)
// addToIndexes(rootIndexes, doc)



const users = [
    [1],
    [20],
    [30],
    [40],
    [50],
    [60],
    [70],
    [80],
    [90],
    [100],
    [110],
    [120],
    [130],
    [140],
    [150],
    [160],
    [170],
    [180]
]