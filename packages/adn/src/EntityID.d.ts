/// <reference types="node" />
import ObjectID from 'bson-objectid';
import util from 'util';
/**
 * EntityID
 *
 * examples
 *  - '01|507f1f77bcf86cd799439011'
 */
export declare class EntityID {
    internalID: number;
    objectID: ObjectID;
    /**
     * Generate a new EntityID and generate an associated ObjectID with the given internal ID
     */
    constructor(internalID: number);
    constructor(hex: string);
    [util.inspect.custom](): string;
    toString(): string;
}
