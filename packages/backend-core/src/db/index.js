let Pouch
let POUCH_DB_DEFAULTS = {}
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
module.exports.setDB = pouch => {
  Pouch = pouch
  // if (process.env.IS_AWS_LAMBDA_DIRECT_DYNAMO){
  //   Pouch=pouch.defaults(POUCH_DB_DEFAULTS)
  // }
}

module.exports.getDB = dbName => {
  if (process.env.IS_AWS_LAMBDA_DIRECT_DYNAMO) {
    return new (Pouch.defaults(POUCH_DB_DEFAULTS))(dbName)
  }

  return new Pouch(dbName)
}

module.exports.getCouch = () => {
  if (process.env.IS_AWS_LAMBDA_DIRECT_DYNAMO) {
    return Pouch.defaults(POUCH_DB_DEFAULTS)
  }
  return Pouch
}
