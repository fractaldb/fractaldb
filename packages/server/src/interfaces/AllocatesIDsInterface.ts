import ManagesIDAllocation from './ManagesIDAllocation'

export default interface AllocatesIDsInterface extends ManagesIDAllocation {
    allocateID(): Promise<number>
}