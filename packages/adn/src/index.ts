import deserialize from './Deserialize'
import serialize from './Serialize'

let x: Map<any, any> = new Map([[123, { xyz: 'abc' }]])

console.log(deserialize(serialize(x)))

export {
    deserialize,
    serialize
}