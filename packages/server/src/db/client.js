const PouchDB = require("pouchdb")
const { getCouchUrl } = require("@budibase/backend-core/db")
const replicationStream = require("pouchdb-replication-stream")
const allDbs = require("pouchdb-all-dbs")
const find = require("pouchdb-find")
const env = require("../environment")

const COUCH_DB_URL = getCouchUrl() || "http://localhost:10000/db/"

PouchDB.plugin(replicationStream.plugin)
PouchDB.plugin(find)
PouchDB.adapter("writableStream", replicationStream.adapters.writableStream)

let POUCH_DB_DEFAULTS = {
  prefix: COUCH_DB_URL,
}
if (process.env.IS_AWS_LAMBDA_DIRECT_DYNAMO) {
  const { DynamoDB } = require("aws-sdk")
  const { DynamoDbDown } = require("pv-dynamodb-leveldown")

  const DynamoDbOptions = {
    region: "eu-west-2",
    // accessKeyId: 'abc',
    // secretAccessKey: '123',
    // paramValidation: false,
    // endpoint: `http://localhost:${process.env.DYNAMODB_PORT}`,
  }

  const dynamoDb = new DynamoDB(DynamoDbOptions)
  const dynamoDownFactory = DynamoDbDown.factory(dynamoDb)

  const leveldownAdapter = location => {
    const dynamoDown = dynamoDownFactory(location)
    return dynamoDown
  }
  POUCH_DB_DEFAULTS = {
    db: leveldownAdapter,
    dynamodb: {},
  }
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
