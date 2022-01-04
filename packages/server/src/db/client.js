import PouchDB from "pouchdb"
import { getCouchUrl } from "@budibase/auth/db"
import replicationStream from "pouchdb-replication-stream"
import allDbs from "pouchdb-all-dbs"
import find from "pouchdb-find"
import env from "../environment"

const COUCH_DB_URL = getCouchUrl() || "http://localhost:10000/db/"

PouchDB.plugin(replicationStream.plugin)
PouchDB.plugin(find)
PouchDB.adapter("writableStream", replicationStream.adapters.writableStream)

let POUCH_DB_DEFAULTS = {
  prefix: COUCH_DB_URL,
}

if (env.isTest()) {
  PouchDB.plugin(require("pouchdb-adapter-memory"))
  POUCH_DB_DEFAULTS = {
    prefix: undefined,
    adapter: "memory",
  }
}

const Pouch = PouchDB.defaults(POUCH_DB_DEFAULTS)

// have to still have pouch alldbs for testing
allDbs(Pouch)

export default Pouch
