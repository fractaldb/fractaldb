# ADN (Advanced Data Notation)

> Like JSON, but more compact & supports more features (maps, sets, etc)

## Installation

```
npm i @framework-tools/adn
```


## Usage

```js
import { ADN } from '@fractaldb/adn'
let adn = new ADN()
let obj = {
    hello: 'world'
}

console.log(adn.deserialize(adn.serialize(obj)))
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