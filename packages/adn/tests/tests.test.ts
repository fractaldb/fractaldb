import { EntityID, EntityIDExtension } from '../src/EntityID'
import { ADN } from '../src/index'

const adn = new ADN([])

/**
 * A helper that serializes and deserializes a value to get to it's original value
 */
const SerDes = (val: any) => adn.deserialize(adn.serialize(val))


describe('can serialize primitives', () => {
    test('can serialize/deserialize false primitive', () => {
        expect(SerDes(false)).toEqual(false);
    });
    
    test('can serialize/deserialize true primitive', () => {
        expect(SerDes(true)).toEqual(true);
    });
    
    test('can serialize/deserialize null primitive', () => {
        expect(SerDes(null)).toEqual(null);
    });

    test('can serialize/deserialize number primitive', () => {
        expect(SerDes(123)).toEqual(123);
    });

    test('can serialize/deserialize undefined', () => {
        expect(SerDes(undefined)).toEqual(undefined)
    })

    describe('can serialize string primitive', () => {
        test('can serialize/deserialize string with chars', () => {
            expect(SerDes("hello world")).toEqual("hello world")
        });

        test('can serialize/deserialize string with no chars', () => {
            expect(SerDes("")).toEqual("")
        });
    
        test('can serialize/deserialize strings with null bytes', () => {
            expect(SerDes("\x00")).toEqual("\x00")
        })
    })
})

describe('can serialise objects', () => {
    test('can serialise/deserialize object with nested object', () => {
        let val = {
            nestedObj: {
                someValue: 'test'
            },
            valueAfter: 123
        }
        expect(SerDes(val)).toEqual(val)
    })

    test('can serialize/deserialize empty object', () => {
        expect(SerDes({})).toEqual({})
    })

    test('can serialize/deserialize object with nested array', () => {
        let val = {
            arr: ['Hello world']
        }
        expect(SerDes(val)).toEqual(val)
    })

    test('can serialize/deserialize object with undefined value', () => {
        let val = {
            someValue: undefined,
            valueAfter: 123
        }
        expect(SerDes(val)).toEqual(val)
    })
})

describe('can serialise arrays', () => {
    test('can serialise/deserialize array with nested object', () => {
        let val = ['hello world', ['nested array'], { childObject: {} }]
        expect(SerDes(val)).toEqual(val)
    })

    test('can serialize/deserialize empty array', () => {
        expect(SerDes([])).toEqual([])
    })

    test('can serialize/deserialize array with new Array', () => {
        expect(SerDes(new Array())).toEqual(new Array())
    })

    test('removes undefined items in array', () => {
        expect(SerDes([undefined, 'hello world', undefined, 123])).toEqual(['hello world', 123])
    })

    test('can serialize/deserialize array with undefined value', () => {
        expect(SerDes(['hello world', undefined, undefined, 'xyz'])).toEqual(['hello world', 'xyz'])
    })

    test('can serialize/deserialise array with value followed after', () => {
        let obj = {
            map: ['test'],
            obj: {
                str: 'hello world'
            }
        }

        expect(SerDes(obj)).toEqual(obj)
    })
})

describe('can serialise maps', () => {
    test('can serialize/deserialize map with no values', () => {
        expect(SerDes(new Map([]))).toEqual(new Map([]))
    })

    test('can serialize/deserialize map with non-primitive key', () => {
        let objKey = { abc: '123' }
        expect(SerDes(new Map([[objKey, false]]))).toEqual(new Map([[objKey, false]]))
    })

    test('can serialize/deserialise map with object followed after', () => {
        let val = {
            map: new Map([['abc', 123]]),
            obj: {
                str: 'hello world'
            }
        }

        expect(SerDes(val)).toEqual(val)
    })

    test('can serialize/deserialize map with non-primitive key', () => {
        let objKey = { abc: '123' }
        expect(SerDes(new Map([[objKey, false]]))).toEqual(new Map([[objKey, false]]))
    })

    test('can handle maps with undefined keys', () => {
        expect(SerDes(new Map([[undefined, 123]]))).toEqual(new Map([]))
    })
})

describe('add custom serialization/deserialization entity', () => {
    test('can handle entityID extension', () => {
        
    
        let adn = new ADN([
            new EntityIDExtension('\x01')
        ])

        let val = {
            id: new EntityID(1),
            nextValue: 'string'
        }

        let deserialized = adn.deserialize(adn.serialize(val))

        expect(deserialized).toEqual(val)
        expect(deserialized.id).toBeInstanceOf(EntityID)
    })
})