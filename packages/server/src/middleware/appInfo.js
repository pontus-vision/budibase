import { isDevAppID, isProdAppID } from "../db/utils"

export const AppType = {
  DEV: "dev",
  PROD: "prod",
}

export const middleware =
  ({ appType } = {}) =>
  (ctx, next) => {
    const appId = ctx.appId
    if (appType === exports.AppType.DEV && appId && !isDevAppID(appId)) {
      ctx.throw(400, "Only apps in development support this endpoint")
    }
    if (appType === exports.AppType.PROD && appId && !isProdAppID(appId)) {
      ctx.throw(400, "Only apps in production support this endpoint")
    }
    return next()
  }
