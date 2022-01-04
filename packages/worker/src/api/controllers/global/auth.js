import authPkg from "@budibase/auth"
import { getScopedConfig } from "@budibase/auth/db"
import { google } from "@budibase/auth/src/middleware"
import { oidc } from "@budibase/auth/src/middleware"
import { Configs, EmailTemplatePurpose } from "../../../constants"
import { sendEmail, isEmailConfigured } from "../../../utilities/email"
const {
  setCookie,
  getCookie,
  clearCookie,
  getGlobalUserByEmail,
  hash,
  platformLogout,
} = authPkg.utils
const { Cookies } = authPkg.constants
const { passport } = authPkg.auth
import { checkResetPasswordCode } from "../../../utilities/redis"
import { getGlobalDB, getTenantId, isMultiTenant } from "@budibase/auth/tenancy"
import env from "../../../environment"

const ssoCallbackUrl = async (config, type) => {
  // incase there is a callback URL from before
  if (config && config.callbackURL) {
    return config.callbackURL
  }

  const db = getGlobalDB()
  const publicConfig = await getScopedConfig(db, {
    type: Configs.SETTINGS,
  })

  let callbackUrl = `/api/global/auth`
  if (isMultiTenant()) {
    callbackUrl += `/${getTenantId()}`
  }
  callbackUrl += `/${type}/callback`

  return `${publicConfig.platformUrl}${callbackUrl}`
}

export const googleCallbackUrl = async config => {
  return ssoCallbackUrl(config, "google")
}

export const oidcCallbackUrl = async config => {
  return ssoCallbackUrl(config, "oidc")
}

async function authInternal(ctx, user, err = null, info = null) {
  if (err) {
    console.error("Authentication error", err)
    return ctx.throw(403, info ? info : "Unauthorized")
  }

  if (!user) {
    return ctx.throw(403, info ? info : "Unauthorized")
  }

  setCookie(ctx, user.token, Cookies.Auth, { sign: false })
  // get rid of any app cookies on login
  // have to check test because this breaks cypress
  if (!env.isTest()) {
    clearCookie(ctx, Cookies.CurrentApp)
  }
}

export const authenticate = async (ctx, next) => {
  return passport.authenticate("local", async (err, user, info) => {
    await authInternal(ctx, user, err, info)

    delete user.token

    ctx.body = { user }
  })(ctx, next)
}

export const setInitInfo = ctx => {
  const initInfo = ctx.request.body
  setCookie(ctx, initInfo, Cookies.Init)
  ctx.status = 200
}

export const getInitInfo = ctx => {
  ctx.body = getCookie(ctx, Cookies.Init) || {}
}

/**
 * Reset the user password, used as part of a forgotten password flow.
 */
export const reset = async ctx => {
  const { email } = ctx.request.body
  const configured = await isEmailConfigured()
  if (!configured) {
    ctx.throw(
      400,
      "Please contact your platform administrator, SMTP is not configured."
    )
  }
  try {
    const user = await getGlobalUserByEmail(email)
    // only if user exists, don't error though if they don't
    if (user) {
      await sendEmail(email, EmailTemplatePurpose.PASSWORD_RECOVERY, {
        user,
        subject: "{{ company }} platform password reset",
      })
    }
  } catch (err) {
    console.log(err)
    // don't throw any kind of error to the user, this might give away something
  }
  ctx.body = {
    message: "Please check your email for a reset link.",
  }
}

/**
 * Perform the user password update if the provided reset code is valid.
 */
export const resetUpdate = async ctx => {
  const { resetCode, password } = ctx.request.body
  try {
    const { userId } = await checkResetPasswordCode(resetCode)
    const db = getGlobalDB()
    const user = await db.get(userId)
    user.password = await hash(password)
    await db.put(user)
    ctx.body = {
      message: "password reset successfully.",
    }
  } catch (err) {
    ctx.throw(400, "Cannot reset password.")
  }
}

export const logout = async ctx => {
  await platformLogout({ ctx, userId: ctx.user._id })
  ctx.body = { message: "User logged out." }
}

/**
 * The initial call that google authentication makes to take you to the google login screen.
 * On a successful login, you will be redirected to the googleAuth callback route.
 */
export const googlePreAuth = async (ctx, next) => {
  const db = getGlobalDB()

  const config = await authPkg.db.getScopedConfig(db, {
    type: Configs.GOOGLE,
    workspace: ctx.query.workspace,
  })
  let callbackUrl = await googleCallbackUrl(config)
  const strategy = await google.strategyFactory(config, callbackUrl)

  return passport.authenticate(strategy, {
    scope: ["profile", "email"],
  })(ctx, next)
}

export const googleAuth = async (ctx, next) => {
  const db = getGlobalDB()

  const config = await authPkg.db.getScopedConfig(db, {
    type: Configs.GOOGLE,
    workspace: ctx.query.workspace,
  })
  const callbackUrl = await googleCallbackUrl(config)
  const strategy = await google.strategyFactory(config, callbackUrl)

  return passport.authenticate(
    strategy,
    { successRedirect: "/", failureRedirect: "/error" },
    async (err, user, info) => {
      await authInternal(ctx, user, err, info)

      ctx.redirect("/")
    }
  )(ctx, next)
}

async function oidcStrategyFactory(ctx, configId) {
  const db = getGlobalDB()
  const config = await authPkg.db.getScopedConfig(db, {
    type: Configs.OIDC,
    group: ctx.query.group,
  })

  const chosenConfig = config.configs.filter(c => c.uuid === configId)[0]
  let callbackUrl = await oidcCallbackUrl(chosenConfig)

  return oidc.strategyFactory(chosenConfig, callbackUrl)
}

/**
 * The initial call that OIDC authentication makes to take you to the configured OIDC login screen.
 * On a successful login, you will be redirected to the oidcAuth callback route.
 */
export const oidcPreAuth = async (ctx, next) => {
  const { configId } = ctx.params
  const strategy = await oidcStrategyFactory(ctx, configId)

  setCookie(ctx, configId, Cookies.OIDC_CONFIG)

  return passport.authenticate(strategy, {
    // required 'openid' scope is added by oidc strategy factory
    scope: ["profile", "email"],
  })(ctx, next)
}

export const oidcAuth = async (ctx, next) => {
  const configId = getCookie(ctx, Cookies.OIDC_CONFIG)
  const strategy = await oidcStrategyFactory(ctx, configId)

  return passport.authenticate(
    strategy,
    { successRedirect: "/", failureRedirect: "/error" },
    async (err, user, info) => {
      await authInternal(ctx, user, err, info)

      ctx.redirect("/")
    }
  )(ctx, next)
}
