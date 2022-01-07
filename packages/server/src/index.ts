if (!process.env.IS_AWS_LAMBDA) {
  const fixPath = require("fix-path")
  const { checkDevelopmentEnvironment } = require("./utilities/fileSystem")

  function runServer() {
    // this will shutdown the system if development environment not ready
    // will print an error explaining what to do
    checkDevelopmentEnvironment()
    fixPath()
    require("./app")
  }

  runServer()
}
const CouchDB = require("./db")
const api = require("./api")
const eventEmitter = require("./events")
const automations = require("./automations/index")
const fileSystem = require("./utilities/fileSystem")
const bullboard = require("./automations/bullboard")
const redis = require("./utilities/redis")

export {
  api,
  eventEmitter,
  automations,
  fileSystem,
  bullboard,
  redis,
  CouchDB

}