const PouchDB = require("pouchdb")
const env = require("../../environment")

let POUCH_DB_DEFAULTS

// should always be test but good to do the sanity check
if (env.isTest()) {
  PouchDB.plugin(require("pouchdb-adapter-memory"))
  POUCH_DB_DEFAULTS = {
    prefix: undefined,
    adapter: "memory",
  }
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
  // Pouch=Pouch.defaults(POUCH_DB_DEFAULTS)
}
const Pouch = PouchDB.defaults(POUCH_DB_DEFAULTS)

module.exports = Pouch
