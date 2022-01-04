import { budibaseTempDir } from "../budibaseDir"
import { isDev } from "../index"
// const fs = require("fs")
import fs from "fs"
// const { join } = require("path")
import { join } from "path"
// const uuid = require("uuid/v4")
// import { uuid } from "uuid/v4"
import { v4 as uuid } from "uuid"

import CouchDB from "../../db"
import { ObjectStoreBuckets } from "../../constants"
import {
  upload,
  retrieve,
  retrieveToTmp,
  streamUpload,
  deleteFolder,
  downloadTarball,
} from "./utilities"
import { updateClientLibrary } from "./clientLibrary"
import env from "../../environment"
import { USER_METDATA_PREFIX, LINK_USER_METADATA_PREFIX } from "../../db/utils"
import MemoryStream from "memorystream"

const TOP_LEVEL_PATH = join(__dirname, "..", "..", "..")
const NODE_MODULES_PATH = join(TOP_LEVEL_PATH, "node_modules")

/**
 * The single stack system (Cloud and Builder) should not make use of the file system where possible,
 * this file handles all of the file access for the system with the intention of limiting it all to one
 * place. Keeping all of this logic in one place means that when we need to do file system access (like
 * downloading a package or opening a temporary file) in can be done in way that we can confirm it shouldn't
 * be done through an object store instead.
 */

/**
 * Upon first startup of instance there may not be everything we need in tmp directory, set it up.
 */
export const init = () => {
  const tempDir = budibaseTempDir()
  console.log(`TempDir is ${tempDir}`)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  const clientLibPath = join(budibaseTempDir(), "budibase-client.js")
  if (env.isTest() && !fs.existsSync(clientLibPath)) {
    fs.copyFileSync(require.resolve("@budibase/client"), clientLibPath)
  }
}

/**
 * Checks if the system is currently in development mode and if it is makes sure
 * everything required to function is ready.
 */
export const checkDevelopmentEnvironment = () => {
  if (!isDev()) {
    return
  }
  if (!fs.existsSync(budibaseTempDir())) {
    fs.mkdirSync(budibaseTempDir())
  }
  let error
  if (!fs.existsSync(join(process.cwd(), ".env"))) {
    error = "Must run via yarn once to generate environment."
  }
  if (error) {
    console.error(error)
    process.exit(-1)
  }
}

/**
 * This function manages temporary template files which are stored by Koa.
 * @param {Object} template The template object retrieved from the Koa context object.
 * @returns {Object} Returns an fs read stream which can be loaded into the database.
 */
export const getTemplateStream = async template => {
  if (template.file) {
    return fs.createReadStream(template.file.path)
  } else {
    const [type, name] = template.key.split("/")
    const tmpPath = await downloadTemplate(type, name)
    return fs.createReadStream(join(tmpPath, name, "db", "dump.txt"))
  }
}

/**
 * Used to retrieve a handlebars file from the system which will be used as a template.
 * This is allowable as the template handlebars files should be static and identical across
 * the cluster.
 * @param {string} path The path to the handlebars file which is to be loaded.
 * @returns {string} The loaded handlebars file as a string - loaded as utf8.
 */
export const loadHandlebarsFile = path => {
  return fs.readFileSync(path, "utf8")
}

/**
 * When return a file from the API need to write the file to the system temporarily so we
 * can create a read stream to send.
 * @param {string} contents the contents of the file which is to be returned from the API.
 * @return {Object} the read stream which can be put into the koa context body.
 */
export const apiFileReturn = contents => {
  const path = join(budibaseTempDir(), uuid())
  fs.writeFileSync(path, contents)
  return fs.createReadStream(path)
}

/**
 * Local utility to back up the database state for an app, excluding global user
 * data or user relationships.
 * @param {string} appId The app to backup
 * @param {object} config Config to send to export DB
 * @returns {*} either a string or a stream of the backup
 */
const backupAppData = async (appId, config) => {
  return await exportDB(appId, {
    ...config,
    filter: doc =>
      !(
        doc._id.includes(USER_METDATA_PREFIX) ||
        doc._id.includes(LINK_USER_METADATA_PREFIX)
      ),
  })
}

/**
 * Takes a copy of the database state for an app to the object store.
 * @param {string} appId The ID of the app which is to be backed up.
 * @param {string} backupName The name of the backup located in the object store.
 * @return {*} a readable stream to the completed backup file
 */
export const performBackup = async (appId, backupName) => {
  return await backupAppData(appId, { exportName: backupName })
}

/**
 * Streams a backup of the database state for an app
 * @param {string} appId The ID of the app which is to be backed up.
 * @returns {*} a readable stream of the backup which is written in real time
 */
export const streamBackup = async appId => {
  return await backupAppData(appId, { stream: true })
}

/**
 * Exports a DB to either file or a variable (memory).
 * @param {string} dbName the DB which is to be exported.
 * @param {string} exportName optional - provide a filename to write the backup to a file
 * @param {boolean} stream optional - whether to perform a full backup
 * @param {function} filter optional - a filter function to clear out any un-wanted docs.
 * @return {*} either a readable stream or a string
 */
export const exportDB = async (dbName, { stream, filter, exportName } = {}) => {
  const instanceDb = new CouchDB(dbName)

  // Stream the dump if required
  if (stream) {
    const memStream = new MemoryStream()
    instanceDb.dump(memStream, { filter })
    return memStream
  }

  // Write the dump to file if required
  if (exportName) {
    const path = join(budibaseTempDir(), exportName)
    const writeStream = fs.createWriteStream(path)
    await instanceDb.dump(writeStream, { filter })

    // Upload the dump to the object store if self hosted
    if (env.SELF_HOSTED) {
      await streamUpload(
        ObjectStoreBuckets.BACKUPS,
        join(dbName, exportName),
        fs.createReadStream(path)
      )
    }

    return fs.createReadStream(path)
  }

  // Stringify the dump in memory if required
  const memStream = new MemoryStream()
  let appString = ""
  memStream.on("data", chunk => {
    appString += chunk.toString()
  })
  await instanceDb.dump(memStream, { filter })
  return appString
}

/**
 * Writes the provided contents to a temporary file, which can be used briefly.
 * @param {string} fileContents contents which will be written to a temp file.
 * @return {string} the path to the temp file.
 */
export const storeTempFile = fileContents => {
  const path = join(budibaseTempDir(), uuid())
  fs.writeFileSync(path, fileContents)
  return path
}

/**
 * Utility function for getting a file read stream - a simple in memory buffered read
 * stream doesn't work for pouchdb.
 */
export const stringToFileStream = contents => {
  const path = storeTempFile(contents)
  return fs.createReadStream(path)
}

/**
 * Creates a temp file and returns it from the API.
 * @param {string} fileContents the contents to be returned in file.
 */
export const sendTempFile = fileContents => {
  const path = storeTempFile(fileContents)
  return fs.createReadStream(path)
}

/**
 * Uploads the latest client library to the object store.
 * @param {string} appId The ID of the app which is being created.
 * @return {Promise<void>} once promise completes app resources should be ready in object store.
 */
export const createApp = async appId => {
  await updateClientLibrary(appId)
}

/**
 * Removes all of the assets created for an app in the object store.
 * @param {string} appId The ID of the app which is being deleted.
 * @return {Promise<void>} once promise completes the app resources will be removed from object store.
 */
export const deleteApp = async appId => {
  await deleteFolder(ObjectStoreBuckets.APPS, `${appId}/`)
}

/**
 * Retrieves a template and pipes it to minio as well as making it available temporarily.
 * @param {string} type The type of template which is to be retrieved.
 * @param name
 * @return {Promise<*>}
 */
export const downloadTemplate = async (type, name) => {
  const DEFAULT_TEMPLATES_BUCKET =
    "prod-budi-templates.s3-eu-west-1.amazonaws.com"
  const templateUrl = `https://${DEFAULT_TEMPLATES_BUCKET}/templates/${type}/${name}.tar.gz`
  return downloadTarball(templateUrl, ObjectStoreBuckets.TEMPLATES, type)
}

/**
 * Retrieves component libraries from object store (or tmp symlink if in local)
 */
export const getComponentLibraryManifest = async (appId, library) => {
  const filename = "manifest.json"
  /* istanbul ignore next */
  // when testing in cypress and so on we need to get the package
  // as the environment may not be fully fleshed out for dev or prod
  if (env.isTest()) {
    library = library.replace("standard-components", "client")
    const lib = library.split("/")[1]
    const path = require.resolve(library).split(lib)[0]
    return require(join(path, lib, filename))
  } else if (env.isDev()) {
    const path = join(NODE_MODULES_PATH, "@budibase", "client", filename)
    // always load from new so that updates are refreshed
    delete require.cache[require.resolve(path)]
    return require(path)
  }

  let resp
  try {
    // Try to load the manifest from the new file location
    const path = join(appId, filename)
    resp = await retrieve(ObjectStoreBuckets.APPS, path)
  } catch (error) {
    // Fallback to loading it from the old location for old apps
    const path = join(appId, "node_modules", library, "package", filename)
    resp = await retrieve(ObjectStoreBuckets.APPS, path)
  }
  if (typeof resp !== "string") {
    resp = resp.toString("utf8")
  }
  return JSON.parse(resp)
}

/**
 * All file reads come through here just to make sure all of them make sense
 * allows a centralised location to check logic is all good.
 */
export const readFileSync = (filepath, options = "utf8") => {
  return fs.readFileSync(filepath, options)
}

/**
 * Given a set of app IDs makes sure file system is cleared of any of their temp info.
 */
export const cleanup = appIds => {
  for (let appId of appIds) {
    const path = join(budibaseTempDir(), appId)
    if (fs.existsSync(path)) {
      fs.rmdirSync(path, { recursive: true })
    }
  }
}

export { upload, retrieve, retrieveToTmp, TOP_LEVEL_PATH, NODE_MODULES_PATH }
