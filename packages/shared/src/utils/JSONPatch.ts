

interface UnsetOperation {
    op: 'unset'
    path: string
}

interface SetOperation {
    op: 'set'
    path: string
    value: any
}

interface CopyOperation {
    op: 'copy'
    from: string
    path: string
}

interface MoveOperation {
    op: 'move'
    from: string,
    path: string
}

export type UpdateOperation = 
    | UnsetOperation
    | SetOperation
    | CopyOperation
    | MoveOperation


export function apply(doc: any, operation: UpdateOperation): any {
    switch(operation.op) {
        case 'set': 
            return setOperation(doc, operation.path, operation.value)
        case 'copy':
            return copyOperation(doc, operation.from, operation.path)
        case 'unset':
            return unsetOperation(doc, operation.path)
        case 'move':
            return moveOperation(doc, operation.from, operation.path)
    }
}

function formatPath(paths: (string | number)[], depth: number) {
    let strings = []
    for (let i = 0; i < depth + 1; i++) {
        strings.push(paths[i])
    }
    return strings.join('/')
}

// /statements/<0x23>/-2

type Path = { path: string | number, type: '-' | '+' | null}

function parsePath(pathString: string, paths: string[], depth: number): Path {
    let type: '+' | '-' | null = pathString[0] === '+' || pathString[0] === '-' ? pathString[0] : null
    let path: string | number = type ? pathString.slice(1) : pathString
    if(parseInt(path)) path = parseInt(path)
    if(type && isNaN(Number(path))) throw new Error(`Number not received in ${formatPath(paths, depth)}`)
    return {
        path,
        type
    }
}

function generatePath(path: string) : Path[] {
    let paths = path.split('/')
    if(paths.length < 2) throw new Error(`A path must start with '/' at it's beginning`)
    return paths.map((singlePath, depth) => parsePath(singlePath, paths, depth))
}

function getValueByPointer(doc: any, paths: Path[]) {
    let i = 0, length = paths.length
    let lastDoc = doc

    while(i < length) {
        let { path } = paths[i]
        if(lastDoc && lastDoc[path]) {
            lastDoc = lastDoc[path]
        } else {
            throw new Error(`Value did not exist in '${formatPath(paths.map(({path}) => path), i)}'`)
        }
        ++i
    }

    return [lastDoc, i]
}

function isObject(val: any): boolean {
    return typeof val === 'object' && val !== null
}

export function setOperation(root: any, pathString: string, value: any) {
    if(pathString === '') { // this is a root operation
        return value
    }

    let paths = generatePath(pathString)
    paths.shift() // remove '' root
    let { path, type } = paths.pop() as Path
    let [parentObj, i] = getValueByPointer(root, paths)

    if(Array.isArray(parentObj)){
        path = Number(path) // no string will coalece to 0
        if(type === '+'){
            parentObj.push(value)
        } else {
            if(path as number > parentObj.length) {
                throw new Error(`The specified index in '${formatPath(pathString.split('/'), i)}' MUST NOT be greater than the number of elements in the array`)
            }
            if (type === '-'){
                parentObj.splice(path as number, 0, value)
            } else {
                parentObj[path] = value
            }
        }

    } else {
        if(typeof path === 'number') throw new Error(`Cannot use a number or '+' or '-' on non-array paths: ${formatPath(pathString.split('/'), i)}`)
        parentObj[path] = value
    }

    return root
}

export function unsetOperation(root: any, pathString: string) {
    if(pathString === '') { // this is a root operation
        return null
    }

    let paths = generatePath(pathString)
    paths.shift() // remove '' root
    let { path } = paths.pop() as Path
    let [parentObj] = getValueByPointer(root, paths)

    delete parentObj[path]

    return root 
}

export function moveOperation(root: any, fromPath: string, toPath:string){
    let fromPaths = generatePath(fromPath)
    fromPaths.shift() // remove '' root
    let { path: fromPathLast } = fromPaths.pop() as Path
    let [fromParent] = getValueByPointer(root, fromPaths)
    if(toPath === ''){ // root operation to move from to root
        return fromParent[fromPathLast]
    }

    let toPaths = generatePath(toPath)
    toPaths.shift() // remove '' root

    let { path: toPathLast } = toPaths.pop() as Path
    let [toParent] = getValueByPointer(root, toPaths)

    toParent[toPathLast] = fromParent[fromPathLast]
    delete fromParent[fromPathLast]
    
    return root
}

export function copyOperation(root: any, fromPath: string, toPath:string) {
    let fromPaths = generatePath(fromPath)
    fromPaths.shift() // remove '' root
    let [fromValue] = getValueByPointer(root, fromPaths)

    if(toPath === ''){ // root operation to move from to root
        return fromValue
    }

    let toPaths = generatePath(toPath)
    toPaths.shift() // remove '' root

    let { path } = toPaths.pop() as Path // pop an item off the end of the array to set the value in the parent

    let [parentObj] = getValueByPointer(root, toPaths)

    parentObj[path] = JSON.parse(JSON.stringify(fromValue))

    return root
}
