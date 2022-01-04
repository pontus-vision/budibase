// need to load environment first
import env from "./environment"

import CouchDB from "./db"

import * as auth from "@budibase/auth"

auth.init(CouchDB)
import Koa from "koa"
import destroyable from "server-destroy"
import koaBody from "koa-body"
import koaSession from "koa-session"
import "@budibase/auth"
import logger from "koa-pino-logger"
import http from "http"
import api from "./api"
import redis from "./utilities/redis"
import Sentry from "@sentry/node"

const app = new Koa()

app.keys = ["secret", "key"]

// set up top level koa middleware
app.use(koaBody({ multipart: true }))
app.use(koaSession(app))

app.use(
  logger({
    prettyPrint: {
      levelFirst: true,
    },
    level: env.LOG_LEVEL || "error",
  })
)

// authentication
app.use(auth.passport.initialize())
app.use(auth.passport.session())

// api routes
app.use(api.routes())

// sentry
if (env.isProd()) {
  Sentry.init()

  app.on("error", (err, ctx) => {
    Sentry.withScope(function (scope) {
      scope.addEventProcessor(function (event) {
        return Sentry.Handlers.parseRequest(event, ctx.request)
      })
      Sentry.captureException(err)
    })
  })
}

const server = http.createServer(app.callback())
destroyable(server)

server.on("close", async () => {
  if (env.isProd()) {
    console.log("Server Closed")
  }
  await redis.shutdown()
})

export default server.listen(parseInt(env.PORT || 4002), async () => {
  console.log(`Worker running on ${JSON.stringify(server.address())}`)
  await redis.init()
})

process.on("uncaughtException", err => {
  console.error(err)
  server.close()
  server.destroy()
})

process.on("SIGTERM", () => {
  server.close()
  server.destroy()
})
