import passport from "koa-passport"
import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as JwtStrategy } from "passport-jwt"
import { StaticDatabases } from "./db/utils"
import { getGlobalDB } from "./tenancy"
import {
  jwt,
  local,
  authenticated,
  google,
  oidc,
  auditLog,
  tenancy,
  appTenancy,
  authError,
} from "./middleware"
import { setDB } from "./db"
import userCache from "./cache/user"
import constants from "./constants"
import * as dbUtils from "./db/utils"
import Client from "./redis"
import * as redisUtils from "./redis/utils"
// Strategies
passport.use(new LocalStrategy(local.options, local.authenticate))
passport.use(new JwtStrategy(jwt.options, jwt.authenticate))

passport.serializeUser((user, done) => done(null, user))

passport.deserializeUser(async (user, done) => {
  const db = getGlobalDB()

  try {
    const user = await db.get(user._id)
    return done(null, user)
  } catch (err) {
    console.error("User not found", err)
    return done(null, false, { message: "User not found" })
  }
})

export default {
  init(pouch) {
    setDB(pouch)
  },
  db: dbUtils,
  redis: {
    Client,
    utils: redisUtils,
  },
  objectStore: {
    ...require("./objectStore"),
    ...require("./objectStore/utils"),
  },
  utils: {
    ...require("./utils"),
    ...require("./hashing"),
  },
  auth: {
    buildAuthMiddleware: authenticated,
    passport,
    google,
    oidc,
    jwt: require("jsonwebtoken"),
    buildTenancyMiddleware: tenancy,
    buildAppTenancyMiddleware: appTenancy,
    auditLog,
    authError,
  },
  cache: {
    user: userCache,
  },
  StaticDatabases,
  constants,
}
