import ObjectID from 'bson-objectid'
import { ADNExtension } from './index'
import util from 'util'
import { Tokenizer } from './Tokenizer'
import { DataTypes } from './Types'

const COLORS = {
    Reset: "\x1b[0m",
    Bright:"\x1b[1m",
    Dim:"\x1b[2m",
    Underscore:"\x1b[4m",
    Blink:"\x1b[5m",
    Reverse:"\x1b[7m",
    Hidden:"\x1b[8m",
    
    Black:"\x1b[30m",
    Red:"\x1b[31m",
    Green:"\x1b[32m",
    Yellow:"\x1b[33m",
    Blue:"\x1b[34m",
    Magenta:"\x1b[35m",
    Cyan:"\x1b[36m",
    White:"\x1b[37m",
}

/**
 * EntityID
 * 
 * examples
 *  - '01|507f1f77bcf86cd799439011'
 */
export class EntityID {
    internalID: number
    objectID: ObjectID
    
    /**
     * Generate a new EntityID and generate an associated ObjectID with the given internal ID
     */
    constructor(internalID: number);
    constructor(hex: string);
    constructor(arg: string | number){
        if(typeof arg === 'string'){
            let [internalIDString, objectIDString] = arg.split('|')
            this.internalID = parseInt(internalIDString, 16)
            this.objectID = new ObjectID(objectIDString)
        } else if (typeof arg === 'number') {
            this.internalID = arg
            this.objectID = new ObjectID()
        } else {
            throw new Error('You must provide an internal ID or entityID string to create a new EntityID')
        }
    }

    [util.inspect.custom] () {
        return process.stdout?.hasColors?.()
            ? COLORS.Bright + COLORS.Magenta + `EntityID ` + COLORS.White + `[` + COLORS.Magenta + this.toString() + COLORS.White + `]` + COLORS.Reset
            : `EntityID [${this.toString()}]`
    }

    toString(): string {
        return this.internalID.toString(16) + '|' + this.objectID.toHexString()
    }
}

export class EntityIDExtension extends ADNExtension {
    isType(val: any) {
        return val instanceof EntityID
    }
    serialize(val: EntityID, path: string[]) {
        return val.toString()
    }

    deserialize(tokenizer: Tokenizer) {
        function is_not_nullbyte(ch: string): boolean {
            return ch !== DataTypes.NULLBYTE
        }

        return new EntityID(tokenizer.read_until(is_not_nullbyte))
    }
}