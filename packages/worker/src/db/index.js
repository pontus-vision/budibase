const PouchDB = require("pouchdb")
const allDbs = require("pouchdb-all-dbs")
const env = require("../environment")
const { getCouchUrl } = require("@budibase/auth/db")

if (process.env.IS_AWS_LAMBDA) {
  // @ts-ignore no-inner-declarations
  function customLevelAdapter(db) {
    // @ts-ignore no-inner-declarations

    function CustomLevelPouch(opts, callback) {
      const _opts = Object.assign(
        {
          db: db,
          dynamodb: {},
        },
        opts
      )

      // @ts-ignore no-undef
      CoreLevelPouch.call(this, _opts, callback)
    }

    // @ts-ignore no-inner-declarations
    CustomLevelPouch.valid = function () {
      return true
    }

    CustomLevelPouch.use_prefix = false

    // @ts-ignore no-inner-declarations
    return function (PouchDB) {
      PouchDB.adapter("custom-leveldb", CustomLevelPouch, true)
    }
  }
  PouchDB.plugin(customLevelAdapter(require("dynamodb")))
}
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

module.exports = Pouch
