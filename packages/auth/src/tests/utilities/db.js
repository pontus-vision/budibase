import PouchDB from "pouchdb"
import env from "../../environment"

let POUCH_DB_DEFAULTS

// should always be test but good to do the sanity check
if (env.isTest()) {
  PouchDB.plugin(require("pouchdb-adapter-memory"))
  POUCH_DB_DEFAULTS = {
    prefix: undefined,
    adapter: "memory",
  }
}

const Pouch = PouchDB.defaults(POUCH_DB_DEFAULTS)

export default Pouch
