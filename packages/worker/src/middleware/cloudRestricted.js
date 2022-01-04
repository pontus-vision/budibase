import env from "../environment"
import "@budibase/auth"

/**
 * This is a restricted endpoint in the cloud.
 * Ensure that the correct API key has been supplied.
 */
export default async (ctx, next) => {
  if (!env.SELF_HOSTED && !env.DISABLE_ACCOUNT_PORTAL) {
    const apiKey = ctx.request.headers[Headers.API_KEY]
    if (apiKey !== env.INTERNAL_API_KEY) {
      ctx.throw(403, "Unauthorized")
    }
  }

  return next()
}
