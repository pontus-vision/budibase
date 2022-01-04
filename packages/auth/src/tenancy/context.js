import env from "../environment"
import { Headers } from "../../constants"
import cls from "./FunctionContext"

export const DEFAULT_TENANT_ID = "default"

export const isDefaultTenant = () => {
  return getTenantId() === exports.DEFAULT_TENANT_ID
}

export const isMultiTenant = () => {
  return env.MULTI_TENANCY
}

const TENANT_ID = "tenantId"

// used for automations, API endpoints should always be in context already
export const doInTenant = (tenantId, task) => {
  return cls.run(() => {
    // set the tenant id
    cls.setOnContext(TENANT_ID, tenantId)

    // invoke the task
    return task()
  })
}

export const updateTenantId = tenantId => {
  cls.setOnContext(TENANT_ID, tenantId)
}

export const setTenantId = (
  ctx,
  opts = { allowQs: false, allowNoTenant: false }
) => {
  let tenantId
  // exit early if not multi-tenant
  if (!isMultiTenant()) {
    cls.setOnContext(TENANT_ID, this.DEFAULT_TENANT_ID)
    return
  }

  const allowQs = opts && opts.allowQs
  const allowNoTenant = opts && opts.allowNoTenant
  const header = ctx.request.headers[Headers.TENANT_ID]
  const user = ctx.user || {}
  if (allowQs) {
    const query = ctx.request.query || {}
    tenantId = query.tenantId
  }
  // override query string (if allowed) by user, or header
  // URL params cannot be used in a middleware, as they are
  // processed later in the chain
  tenantId = user.tenantId || header || tenantId

  // Set the tenantId from the subdomain
  if (!tenantId) {
    tenantId = ctx.subdomains && ctx.subdomains[0]
  }

  if (!tenantId && !allowNoTenant) {
    ctx.throw(403, "Tenant id not set")
  }
  // check tenant ID just incase no tenant was allowed
  if (tenantId) {
    cls.setOnContext(TENANT_ID, tenantId)
  }
}

export const isTenantIdSet = () => {
  const tenantId = cls.getFromContext(TENANT_ID)
  return !!tenantId
}

export const getTenantId = () => {
  if (!isMultiTenant()) {
    return exports.DEFAULT_TENANT_ID
  }
  const tenantId = cls.getFromContext(TENANT_ID)
  if (!tenantId) {
    throw Error("Tenant id not found")
  }
  return tenantId
}
