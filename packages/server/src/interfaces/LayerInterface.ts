import DatabaseInterface from './DatabaseInterface'

export default interface LayerInterface {

    databases: Map<string, DatabaseInterface | null>

}