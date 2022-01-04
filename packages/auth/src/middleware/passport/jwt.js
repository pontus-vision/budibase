import { Cookies } from "../../constants"
import env from "../../environment"
import { authError } from "./utils"

export const options = {
  secretOrKey: env.JWT_SECRET,
  jwtFromRequest: function (ctx) {
    return ctx.cookies.get(Cookies.Auth)
  },
}

export const authenticate = async function (jwt, done) {
  try {
    return done(null, jwt)
  } catch (err) {
    return authError(done, "JWT invalid", err)
  }
}
