# ADN (Advanced Data Notation)

> Like JSON, but more compact & supports more features (maps, sets, etc)

## Installation

```
npm i @framework-tools/adn
```


## Usage

```js
import { serialize, deserialize } from '@framework-tools/adn'

let obj = {
    hello: 'world'
}

console.log(deserialize(serialize(obj)))
```


## Todo

- [x] EntityID
- [x] escape null bytes in strings
- [ ] tests
- [ ] docs
- [ ] addon system
- [ ] date representation
- [x] map
- [ ] set

## Contribution

```
lerna run watch --parallel
lerna link
lerna run compile
lerna publish
```