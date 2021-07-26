import { access, mkdir } from 'fs/promises'
import { homedir } from 'os'


const homedirPath = homedir()

const fractalPath = `${homedirPath}/fractaldb/`
const dataPath = `${fractalPath}/data/`

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch (e) {
    return false
  }
}
/**
 * storage engine for fractaldb
 * sets up data files for each collection
 */
export class StorageEngine {


  async initialize() {
    // create fractaldb folder if it doesn't exist
    if(!await exists(fractalPath)) {
      await mkdir(fractalPath)
    }
    if(!await exists(dataPath)) {
      await mkdir(dataPath)
    }
  }

  /**
   *
   */
  createCollection(collectionName: string) {

  }
}


