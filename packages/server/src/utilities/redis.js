import { Client, utils } from "@budibase/auth/redis"
import { getGlobalIDFromUserMetadataID } from "../db/utils"

const APP_DEV_LOCK_SECONDS = 600
const AUTOMATION_TEST_FLAG_SECONDS = 60
let devAppClient, debounceClient, flagClient

// we init this as we want to keep the connection open all the time
// reduces the performance hit
export const init = async () => {
  devAppClient = new Client(utils.Databases.DEV_LOCKS)
  debounceClient = new Client(utils.Databases.DEBOUNCE)
  flagClient = new Client(utils.Databases.FLAGS)
  await devAppClient.init()
  await debounceClient.init()
  await flagClient.init()
}

export const shutdown = async () => {
  if (devAppClient) await devAppClient.finish()
  if (debounceClient) await debounceClient.finish()
  if (flagClient) await flagClient.finish()
}

export const doesUserHaveLock = async (devAppId, user) => {
  const value = await devAppClient.get(devAppId)
  if (!value) {
    return true
  }
  // make sure both IDs are global
  const expected = getGlobalIDFromUserMetadataID(value._id)
  const userId = getGlobalIDFromUserMetadataID(user._id)
  return expected === userId
}

export const getAllLocks = async () => {
  const locks = await devAppClient.scan()
  return locks.map(lock => ({
    appId: lock.key,
    user: lock.value,
  }))
}

export const updateLock = async (devAppId, user) => {
  // make sure always global user ID
  const globalId = getGlobalIDFromUserMetadataID(user._id)
  const inputUser = {
    ...user,
    userId: globalId,
    _id: globalId,
  }
  await devAppClient.store(devAppId, inputUser, APP_DEV_LOCK_SECONDS)
}

export const clearLock = async (devAppId, user) => {
  const value = await devAppClient.get(devAppId)
  if (!value) {
    return
  }
  const userId = getGlobalIDFromUserMetadataID(user._id)
  if (value._id !== userId) {
    throw "User does not hold lock, cannot clear it."
  }
  await devAppClient.delete(devAppId)
}

export const checkDebounce = async id => {
  return debounceClient.get(id)
}

export const setDebounce = async (id, seconds) => {
  await debounceClient.store(id, "debouncing", seconds)
}

export const setTestFlag = async id => {
  await flagClient.store(id, { testing: true }, AUTOMATION_TEST_FLAG_SECONDS)
}

export const checkTestFlag = async id => {
  const flag = await flagClient.get(id)
  return !!(flag && flag.testing)
}

export const clearTestFlag = async id => {
  await devAppClient.delete(id)
}
