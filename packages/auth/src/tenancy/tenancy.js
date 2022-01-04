import { getDB } from "../db"
import { SEPARATOR, StaticDatabases, DocumentTypes } from "../db/constants"
import { getTenantId, DEFAULT_TENANT_ID, isMultiTenant } from "./context"
import env from "../environment"

const TENANT_DOC = StaticDatabases.PLATFORM_INFO.docs.tenants
const PLATFORM_INFO_DB = StaticDatabases.PLATFORM_INFO.name

export const addTenantToUrl = url => {
  const tenantId = getTenantId()

  if (isMultiTenant()) {
    const char = url.indexOf("?") === -1 ? "?" : "&"
    url += `${char}tenantId=${tenantId}`
  }

  return url
}

export const doesTenantExist = async tenantId => {
  const db = getDB(PLATFORM_INFO_DB)
  let tenants
  try {
    tenants = await db.get(TENANT_DOC)
  } catch (err) {
    // if theres an error the doc doesn't exist, no tenants exist
    return false
  }
  return (
    tenants &&
    Array.isArray(tenants.tenantIds) &&
    tenants.tenantIds.indexOf(tenantId) !== -1
  )
}

export const tryAddTenant = async (tenantId, userId, email) => {
  const db = getDB(PLATFORM_INFO_DB)
  const getDoc = async id => {
    if (!id) {
      return null
    }
    try {
      return await db.get(id)
    } catch (err) {
      return { _id: id }
    }
  }
  let [tenants, userIdDoc, emailDoc] = await Promise.all([
    getDoc(TENANT_DOC),
    getDoc(userId),
    getDoc(email),
  ])
  if (!Array.isArray(tenants.tenantIds)) {
    tenants = {
      _id: TENANT_DOC,
      tenantIds: [],
    }
  }
  let promises = []
  if (userIdDoc) {
    userIdDoc.tenantId = tenantId
    promises.push(db.put(userIdDoc))
  }
  if (emailDoc) {
    emailDoc.tenantId = tenantId
    emailDoc.userId = userId
    promises.push(db.put(emailDoc))
  }
  if (tenants.tenantIds.indexOf(tenantId) === -1) {
    tenants.tenantIds.push(tenantId)
    promises.push(db.put(tenants))
  }
  await Promise.all(promises)
}

export const getGlobalDBName = (tenantId = null) => {
  // tenant ID can be set externally, for example user API where
  // new tenants are being created, this may be the case
  if (!tenantId) {
    tenantId = getTenantId()
  }

  let dbName
  if (tenantId === DEFAULT_TENANT_ID) {
    dbName = StaticDatabases.GLOBAL.name
  } else {
    dbName = `${tenantId}${SEPARATOR}${StaticDatabases.GLOBAL.name}`
  }
  return dbName
}

export const getGlobalDB = (tenantId = null) => {
  const dbName = getGlobalDBName(tenantId)
  return getDB(dbName)
}

export const lookupTenantId = async userId => {
  const db = getDB(StaticDatabases.PLATFORM_INFO.name)
  let tenantId = env.MULTI_TENANCY ? DEFAULT_TENANT_ID : null
  try {
    const doc = await db.get(userId)
    if (doc && doc.tenantId) {
      tenantId = doc.tenantId
    }
  } catch (err) {
    // just return the default
  }
  return tenantId
}

// lookup, could be email or userId, either will return a doc
export const getTenantUser = async identifier => {
  const db = getDB(PLATFORM_INFO_DB)
  try {
    return await db.get(identifier)
  } catch (err) {
    return null
  }
}

/**
 * Given an app ID this will attempt to retrieve the tenant ID from it.
 * @return {null|string} The tenant ID found within the app ID.
 */
export const getTenantIDFromAppID = appId => {
  if (!appId) {
    return null
  }
  const split = appId.split(SEPARATOR)
  const hasDev = split[1] === DocumentTypes.DEV
  if ((hasDev && split.length === 3) || (!hasDev && split.length === 2)) {
    return null
  }
  if (hasDev) {
    return split[2]
  } else {
    return split[1]
  }
}

export const isUserInAppTenant = (appId, user = null) => {
  let userTenantId
  if (user) {
    userTenantId = user.tenantId || DEFAULT_TENANT_ID
  } else {
    userTenantId = getTenantId()
  }
  const tenantId = getTenantIDFromAppID(appId) || DEFAULT_TENANT_ID
  return tenantId === userTenantId
}
