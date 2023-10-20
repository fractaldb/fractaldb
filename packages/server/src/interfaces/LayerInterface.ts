import DatabaseInterface from './DatabaseInterface.js'

export default interface LayerInterface {

    databases: Map<string, DatabaseInterface | null>

}