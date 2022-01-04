import PouchDB from "pouchdb"
import allDbs from "pouchdb-all-dbs"
import env from "../environment"
import { getCouchUrl } from "@budibase/auth/db"

// level option is purely for testing (development)
const COUCH_DB_URL = getCouchUrl() || "http://localhost:10000/db/"

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
