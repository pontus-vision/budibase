import {
  getAppId,
  getCookie,
  Cookies,
  clearCookie,
  setCookie,
} from "@budibase/auth"
// import '@budibase/auth';
import { getRole } from "@budibase/auth/roles"
import { BUILTIN_ROLE_IDS } from "@budibase/auth/roles"
import { generateUserMetadataID, isDevAppID } from "../db/utils"
import { dbExists } from "@budibase/auth/db"
import { isUserInAppTenant } from "@budibase/auth/tenancy"
import { getCachedSelf } from "../utilities/global"
import CouchDB from "../db"
import env from "../environment"
import { isWebhookEndpoint } from "./utils"

export default async (ctx, next) => {
  // try to get the appID from the request
  let requestAppId = getAppId(ctx)
  // get app cookie if it exists
  let appCookie = null
  try {
    appCookie = getCookie(ctx, Cookies.CurrentApp)
  } catch (err) {
    clearCookie(ctx, Cookies.CurrentApp)
  }
  if (!appCookie && !requestAppId) {
    return next()
  }
  // check the app exists referenced in cookie
  if (appCookie) {
    const appId = appCookie.appId
    const exists = await dbExists(CouchDB, appId)
    if (!exists) {
      clearCookie(ctx, Cookies.CurrentApp)
      return next()
    }
    // if the request app ID wasn't set, update it with the cookie
    requestAppId = requestAppId || appId
  }

  // deny access to application preview
  if (
    isDevAppID(requestAppId) &&
    !isWebhookEndpoint(ctx) &&
    (!ctx.user || !ctx.user.builder || !ctx.user.builder.global)
  ) {
    clearCookie(ctx, Cookies.CurrentApp)
    return ctx.redirect("/")
  }

  let appId,
    roleId = BUILTIN_ROLE_IDS.PUBLIC
  if (!ctx.user) {
    // not logged in, try to set a cookie for public apps
    appId = requestAppId
  } else if (requestAppId != null) {
    // Different App ID means cookie needs reset, or if the same public user has logged in
    const globalUser = await getCachedSelf(ctx, requestAppId)
    appId = requestAppId
    // retrieving global user gets the right role
    roleId = globalUser.roleId || roleId
  }

  // nothing more to do
  if (!appId) {
    return next()
  }

  let noCookieSet = false
  // if the user not in the right tenant then make sure they have no permissions
  // need to judge this only based on the request app ID,
  if (
    env.MULTI_TENANCY &&
    ctx.user &&
    requestAppId &&
    !isUserInAppTenant(requestAppId)
  ) {
    // don't error, simply remove the users rights (they are a public user)
    delete ctx.user.builder
    delete ctx.user.admin
    delete ctx.user.roles
    roleId = BUILTIN_ROLE_IDS.PUBLIC
    noCookieSet = true
  }

  ctx.appId = appId
  if (roleId) {
    ctx.roleId = roleId
    const userId = ctx.user ? generateUserMetadataID(ctx.user._id) : null
    ctx.user = {
      ...ctx.user,
      // override userID with metadata one
      _id: userId,
      userId,
      roleId,
      role: await getRole(appId, roleId),
    }
  }
  if (
    (requestAppId !== appId ||
      appCookie == null ||
      appCookie.appId !== requestAppId) &&
    !noCookieSet
  ) {
    setCookie(ctx, { appId }, Cookies.CurrentApp)
  }

  return next()
}
