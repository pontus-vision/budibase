import {
  isMultiTenant,
  updateTenantId,
  isTenantIdSet,
  DEFAULT_TENANT_ID,
} from "../tenancy"
import ContextFactory from "../tenancy/FunctionContext"
import { getTenantIDFromAppID } from "../db/utils"

export default () => {
  return ContextFactory.getMiddleware(ctx => {
    // if not in multi-tenancy mode make sure its default and exit
    if (!isMultiTenant()) {
      updateTenantId(DEFAULT_TENANT_ID)
      return
    }
    // if tenant ID already set no need to continue
    if (isTenantIdSet()) {
      return
    }
    const appId = ctx.appId ? ctx.appId : ctx.user ? ctx.user.appId : null
    const tenantId = getTenantIDFromAppID(appId) || DEFAULT_TENANT_ID
    updateTenantId(tenantId)
  })
}
