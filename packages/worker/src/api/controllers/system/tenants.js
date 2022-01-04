import CouchDB from "../../../db"
import { StaticDatabases } from "@budibase/auth/db"
import { getTenantId } from "@budibase/auth/tenancy"
import { deleteTenant } from "@budibase/auth/deprovision"

export const exists = async ctx => {
  const tenantId = ctx.request.params
  const db = new CouchDB(StaticDatabases.PLATFORM_INFO.name)
  let exists = false
  try {
    const tenantsDoc = await db.get(StaticDatabases.PLATFORM_INFO.docs.tenants)
    if (tenantsDoc) {
      exists = tenantsDoc.tenantIds.indexOf(tenantId) !== -1
    }
  } catch (err) {
    // if error it doesn't exist
  }
  ctx.body = {
    exists,
  }
}

export const fetch = async ctx => {
  const db = new CouchDB(StaticDatabases.PLATFORM_INFO.name)
  let tenants = []
  try {
    const tenantsDoc = await db.get(StaticDatabases.PLATFORM_INFO.docs.tenants)
    if (tenantsDoc) {
      tenants = tenantsDoc.tenantIds
    }
  } catch (err) {
    // if error it doesn't exist
  }
  ctx.body = tenants
}

export const del = async ctx => {
  const tenantId = getTenantId()

  if (ctx.params.tenantId !== tenantId) {
    ctx.throw(403, "Unauthorized")
  }

  try {
    await deleteTenant(tenantId)
    ctx.status = 204
  } catch (err) {
    ctx.log.error(err)
    throw err
  }
}
