const PouchDB = require("pouchdb")
const { getCouchUrl } = require("@budibase/auth/db")
const replicationStream = require("pouchdb-replication-stream")
const allDbs = require("pouchdb-all-dbs")
const find = require("pouchdb-find")
const env = require("../environment")

if (process.env.IS_AWS_LAMBDA) {
  // @ts-ignore no-inner-declarations
  // eslint-ignore no-inner-declarations
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

    CustomLevelPouch.valid = function () {
      return true
    }

    CustomLevelPouch.use_prefix = false

    // @ts-ignore no-inner-declarations
    return function (PouchDB) {
      PouchDB.adapter("custom-leveldb", CustomLevelPouch, true)
    }
  }
  PouchDB.plugin(customLevelAdapter(require("dynamodbdown")))
}

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

module.exports = Pouch
