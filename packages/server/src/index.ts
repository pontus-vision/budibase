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

// export * from './app'

