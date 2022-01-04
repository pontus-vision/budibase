import jwt from "./passport/jwt"
import local from "./passport/local"
import google from "./passport/google"
import oidc from "./passport/oidc"
import { authError } from "./passport/utils"
import authenticated from "./authenticated"
import auditLog from "./auditLog"
import tenancy from "./tenancy"
import appTenancy from "./appTenancy"

export default {
  google,
  oidc,
  jwt,
  local,
  authenticated,
  auditLog,
  tenancy,
  appTenancy,
  authError,
}
