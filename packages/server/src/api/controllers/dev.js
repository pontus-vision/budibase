import fetch from "node-fetch"
import CouchDB from "../../db"
import { WORKER_URL } from "../../environment"
import { checkSlashesInUrl } from "../../utilities"
import { request } from "../../utilities/workerRequests"
import { clearLock } from "../../utilities/redis"
import { db as _db } from "@budibase/auth"
const { Replication } = _db
import { DocumentTypes } from "../../db/utils"
import { app as appCache } from "@budibase/auth/cache"

async function redirect(ctx, method, path = "global") {
  const { devPath } = ctx.params
  const queryString = ctx.originalUrl.split("?")[1] || ""
  const response = await fetch(
    checkSlashesInUrl(`${WORKER_URL}/api/${path}/${devPath}?${queryString}`),
    request(
      ctx,
      {
        method,
        body: ctx.request.body,
      },
      true
    )
  )
  if (response.status !== 200) {
    const err = await response.text()
    ctx.throw(400, err)
  }
  const cookie = response.headers.get("set-cookie")
  if (cookie) {
    ctx.set("set-cookie", cookie)
  }
  let body
  try {
    body = await response.json()
  } catch (err) {
    // don't worry about errors, likely no JSON
  }
  ctx.status = response.status
  if (body) {
    ctx.body = body
  }
  ctx.cookies
}

export function buildRedirectGet(path) {
  return async ctx => {
    await redirect(ctx, "GET", path)
  }
}

export function buildRedirectPost(path) {
  return async ctx => {
    await redirect(ctx, "POST", path)
  }
}

export function buildRedirectDelete(path) {
  return async ctx => {
    await redirect(ctx, "DELETE", path)
  }
}

const _clearLock = async ctx => {
  const { appId } = ctx.params
  try {
    await clearLock(appId, ctx.user)
  } catch (err) {
    ctx.throw(400, `Unable to remove lock. ${err}`)
  }
  ctx.body = {
    message: "Lock released successfully.",
  }
}
export { _clearLock as clearLock }

export async function revert(ctx) {
  const { appId } = ctx.params
  const productionAppId = appId.replace("_dev", "")

  // App must have been deployed first
  try {
    const db = new CouchDB(productionAppId, { skip_setup: true })
    const info = await db.info()
    if (info.error) throw info.error
    const deploymentDoc = await db.get(DocumentTypes.DEPLOYMENTS)
    if (
      !deploymentDoc.history ||
      Object.keys(deploymentDoc.history).length === 0
    ) {
      throw new Error("No deployments for app")
    }
  } catch (err) {
    return ctx.throw(400, "App has not yet been deployed")
  }

  try {
    const replication = new Replication({
      source: productionAppId,
      target: appId,
    })

    await replication.rollback()
    // update appID in reverted app to be dev version again
    const db = new CouchDB(appId)
    const appDoc = await db.get(DocumentTypes.APP_METADATA)
    appDoc.appId = appId
    appDoc.instance._id = appId
    await db.put(appDoc)
    await appCache.invalidateAppMetadata(appId)
    ctx.body = {
      message: "Reverted changes successfully.",
    }
  } catch (err) {
    ctx.throw(400, `Unable to revert. ${err}`)
  }
}

export async function getBudibaseVersion(ctx) {
  ctx.body = require("../../../package.json").version
}
