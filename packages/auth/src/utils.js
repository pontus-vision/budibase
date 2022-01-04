import {
  DocumentTypes,
  SEPARATOR,
  ViewNames,
  generateGlobalUserID,
} from "./db/utils"
import jwt from "jsonwebtoken"
import { options } from "./middleware/passport/jwt"
import { createUserEmailView } from "./db/views"
import { Headers, UserStatus, Cookies, MAX_VALID_DATE } from "./constants"
import {
  getGlobalDB,
  updateTenantId,
  getTenantUser,
  tryAddTenant,
} from "./tenancy"
import environment from "./environment"
import accounts from "./cloud/accounts"
import { hash } from "./hashing"
import userCache from "./cache/user"
import env from "./environment"
import { getUserSessions, invalidateSessions } from "./security/sessions"
import { migrateIfRequired } from "./migrations"
import { MIGRATION_DBS, MIGRATIONS } from "./migrations"
// import './migrations';

const APP_PREFIX = DocumentTypes.APP + SEPARATOR

function confirmAppId(possibleAppId) {
  return possibleAppId && possibleAppId.startsWith(APP_PREFIX)
    ? possibleAppId
    : undefined
}

/**
 * Given a request tries to find the appId, which can be located in various places
 * @param {object} ctx The main request body to look through.
 * @returns {string|undefined} If an appId was found it will be returned.
 */
export const getAppId = ctx => {
  const options = [ctx.headers[Headers.APP_ID], ctx.params.appId]
  if (ctx.subdomains) {
    options.push(ctx.subdomains[1])
  }
  let appId
  for (let option of options) {
    appId = confirmAppId(option)
    if (appId) {
      break
    }
  }

  // look in body if can't find it in subdomain
  if (!appId && ctx.request.body && ctx.request.body.appId) {
    appId = confirmAppId(ctx.request.body.appId)
  }
  let appPath =
    ctx.request.headers.referrer ||
    ctx.path.split("/").filter(subPath => subPath.startsWith(APP_PREFIX))
  if (!appId && appPath.length !== 0) {
    appId = confirmAppId(appPath[0])
  }
  return appId
}

/**
 * Get a cookie from context, and decrypt if necessary.
 * @param {object} ctx The request which is to be manipulated.
 * @param {string} name The name of the cookie to get.
 */
export const getCookie = (ctx, name) => {
  const cookie = ctx.cookies.get(name)

  if (!cookie) {
    return cookie
  }

  return jwt.verify(cookie, options.secretOrKey)
}

/**
 * Store a cookie for the request - it will not expire.
 * @param {object} ctx The request which is to be manipulated.
 * @param {string} name The name of the cookie to set.
 * @param {string|object} value The value of cookie which will be set.
 * @param {object} opts options like whether to sign.
 */
export const setCookie = (
  ctx,
  value,
  name = "builder",
  opts = { sign: true }
) => {
  if (value && opts && opts.sign) {
    value = jwt.sign(value, options.secretOrKey)
  }

  const config = {
    expires: MAX_VALID_DATE,
    path: "/",
    httpOnly: false,
    overwrite: true,
  }

  if (environment.COOKIE_DOMAIN) {
    config.domain = environment.COOKIE_DOMAIN
  }

  ctx.cookies.set(name, value, config)
}

/**
 * Utility function, simply calls setCookie with an empty string for value
 */
export const clearCookie = (ctx, name) => {
  setCookie(ctx, null, name)
}

/**
 * Checks if the API call being made (based on the provided ctx object) is from the client. If
 * the call is not from a client app then it is from the builder.
 * @param {object} ctx The koa context object to be tested.
 * @return {boolean} returns true if the call is from the client lib (a built app rather than the builder).
 */
export const isClient = ctx => {
  return ctx.headers[Headers.TYPE] === "client"
}

/**
 * Given an email address this will use a view to search through
 * all the users to find one with this email address.
 * @param {string} email the email to lookup the user by.
 * @return {Promise<object|null>}
 */
export const getGlobalUserByEmail = async email => {
  if (email == null) {
    throw "Must supply an email address to view"
  }
  const db = getGlobalDB()

  await migrateIfRequired(
    MIGRATION_DBS.GLOBAL_DB,
    MIGRATIONS.USER_EMAIL_VIEW_CASING,
    async () => {
      // re-create the view with latest changes
      await createUserEmailView(db)
    }
  )

  try {
    let users = (
      await db.query(`database/${ViewNames.USER_BY_EMAIL}`, {
        key: email.toLowerCase(),
        include_docs: true,
      })
    ).rows
    users = users.map(user => user.doc)
    return users.length <= 1 ? users[0] : users
  } catch (err) {
    if (err != null && err.name === "not_found") {
      await createUserEmailView(db)
      return getGlobalUserByEmail(email)
    } else {
      throw err
    }
  }
}

export const saveUser = async (
  user,
  tenantId,
  hashPassword = true,
  requirePassword = true
) => {
  if (!tenantId) {
    throw "No tenancy specified."
  }
  // need to set the context for this request, as specified
  updateTenantId(tenantId)
  // specify the tenancy incase we're making a new admin user (public)
  const db = getGlobalDB(tenantId)
  let { email, password, _id } = user
  // make sure another user isn't using the same email
  let dbUser
  if (email) {
    // check budibase users inside the tenant
    dbUser = await getGlobalUserByEmail(email)
    if (dbUser != null && (dbUser._id !== _id || Array.isArray(dbUser))) {
      throw `Email address ${email} already in use.`
    }

    // check budibase users in other tenants
    if (env.MULTI_TENANCY) {
      const tenantUser = await getTenantUser(email)
      if (tenantUser != null && tenantUser.tenantId !== tenantId) {
        throw `Email address ${email} already in use.`
      }
    }

    // check root account users in account portal
    if (!env.SELF_HOSTED && !env.DISABLE_ACCOUNT_PORTAL) {
      const account = await accounts.getAccount(email)
      if (account && account.verified && account.tenantId !== tenantId) {
        throw `Email address ${email} already in use.`
      }
    }
  } else {
    dbUser = await db.get(_id)
  }

  // get the password, make sure one is defined
  let hashedPassword
  if (password) {
    hashedPassword = hashPassword ? await hash(password) : password
  } else if (dbUser) {
    hashedPassword = dbUser.password
  } else if (requirePassword) {
    throw "Password must be specified."
  }

  _id = _id || generateGlobalUserID()
  user = {
    createdAt: Date.now(),
    ...dbUser,
    ...user,
    _id,
    password: hashedPassword,
    tenantId,
  }
  // make sure the roles object is always present
  if (!user.roles) {
    user.roles = {}
  }
  // add the active status to a user if its not provided
  if (user.status == null) {
    user.status = UserStatus.ACTIVE
  }
  try {
    const response = await db.put({
      password: hashedPassword,
      ...user,
    })
    await tryAddTenant(tenantId, _id, email)
    await userCache.invalidateUser(response.id)
    return {
      _id: response.id,
      _rev: response.rev,
      email,
    }
  } catch (err) {
    if (err.status === 409) {
      throw "User exists already"
    } else {
      throw err
    }
  }
}

/**
 * Logs a user out from budibase. Re-used across account portal and builder.
 */
export const platformLogout = async ({ ctx, userId, keepActiveSession }) => {
  if (!ctx) throw new Error("Koa context must be supplied to logout.")

  const currentSession = this.getCookie(ctx, Cookies.Auth)
  let sessions = await getUserSessions(userId)

  if (keepActiveSession) {
    sessions = sessions.filter(
      session => session.sessionId !== currentSession.sessionId
    )
  } else {
    // clear cookies
    this.clearCookie(ctx, Cookies.Auth)
    this.clearCookie(ctx, Cookies.CurrentApp)
  }

  await invalidateSessions(
    userId,
    sessions.map(({ sessionId }) => sessionId)
  )
}
