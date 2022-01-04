import env from "../environment"
import { OBJ_STORE_DIRECTORY } from "../constants"
import { sanitizeKey } from "@budibase/auth/src/objectStore"
import CouchDB from "../db"
import { generateMetadataID } from "../db/utils"
import { Readable } from "stream"

const BB_CDN = "https://cdn.budi.live"

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
export const isDev = env.isDev

export const removeFromArray = (array, element) => {
  const index = array.indexOf(element)
  if (index !== -1) {
    array.splice(index, 1)
  }
  return array
}

/**
 * Makes sure that a URL has the correct number of slashes, while maintaining the
 * http(s):// double slashes.
 * @param {string} url The URL to test and remove any extra double slashes.
 * @return {string} The updated url.
 */
export const checkSlashesInUrl = url => {
  return url.replace(/(https?:\/\/)|(\/)+/g, "$1$2")
}

/**
 * Gets the address of the object store, depending on whether self hosted or in cloud.
 * @return {string} The base URL of the object store (MinIO or S3).
 */
export const objectStoreUrl = () => {
  if (env.SELF_HOSTED) {
    // can use a relative url for this as all goes through the proxy (this is hosted in minio)
    return OBJ_STORE_DIRECTORY
  } else {
    return BB_CDN
  }
}

/**
 * In production the client library is stored in the object store, however in development
 * we use the symlinked version produced by lerna, located in node modules. We link to this
 * via a specific endpoint (under /api/assets/client).
 * @param {string} appId In production we need the appId to look up the correct bucket, as the
 * version of the client lib may differ between apps.
 * @param {string} version The version to retrieve.
 * @return {string} The URL to be inserted into appPackage response or server rendered
 * app index file.
 */
export const clientLibraryPath = (appId, version) => {
  if (env.isProd()) {
    let url = `${objectStoreUrl()}/${sanitizeKey(appId)}/budibase-client.js`
    // append app version to bust the cache
    if (version) {
      url += `?v=${version}`
    }
    return url
  } else {
    return `/api/assets/client`
  }
}

export const attachmentsRelativeURL = attachmentKey => {
  return checkSlashesInUrl(`${objectStoreUrl()}/${attachmentKey}`)
}

export const updateEntityMetadata = async (appId, type, entityId, updateFn) => {
  const db = new CouchDB(appId)
  const id = generateMetadataID(type, entityId)
  // read it to see if it exists, we'll overwrite it no matter what
  let rev,
    metadata = {}
  try {
    const oldMetadata = await db.get(id)
    rev = oldMetadata._rev
    metadata = updateFn(oldMetadata)
  } catch (err) {
    rev = null
    metadata = updateFn({})
  }
  metadata._id = id
  if (rev) {
    metadata._rev = rev
  }
  const response = await db.put(metadata)
  return {
    ...metadata,
    _id: id,
    _rev: response.rev,
  }
}

export const saveEntityMetadata = async (appId, type, entityId, metadata) => {
  return updateEntityMetadata(appId, type, entityId, () => {
    return metadata
  })
}

export const deleteEntityMetadata = async (appId, type, entityId) => {
  const db = new CouchDB(appId)
  const id = generateMetadataID(type, entityId)
  let rev
  try {
    const metadata = await db.get(id)
    if (metadata) {
      rev = metadata._rev
    }
  } catch (err) {
    // don't need to error if it doesn't exist
  }
  if (id && rev) {
    await db.remove(id, rev)
  }
}

export const escapeDangerousCharacters = string => {
  return string
    .replace(/[\\]/g, "\\\\")
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t")
}

export const stringToReadStream = string => {
  return new Readable({
    read() {
      this.push(string)
      this.push(null)
    },
  })
}

export const doesDatabaseExist = async dbName => {
  try {
    const db = new CouchDB(dbName, { skip_setup: true })
    const info = await db.info()
    return info && !info.error
  } catch (err) {
    return false
  }
}

export const formatBytes = bytes => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const byteIncrements = 1024
  let unit = 0
  let size = parseInt(bytes, 10) || 0
  while (size >= byteIncrements && ++unit) {
    size /= byteIncrements
  }
  return `${size.toFixed(size < 10 && unit > 0 ? 1 : 0)}${units[unit]}`
}
