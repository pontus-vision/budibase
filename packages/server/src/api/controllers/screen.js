import CouchDB from "../../db"
import { getScreenParams, generateScreenID } from "../../db/utils"
import { AccessController } from "@budibase/auth/roles"

export async function fetch(ctx) {
  const appId = ctx.appId
  const db = new CouchDB(appId)

  const screens = (
    await db.allDocs(
      getScreenParams(null, {
        include_docs: true,
      })
    )
  ).rows.map(element => element.doc)

  ctx.body = await new AccessController(appId).checkScreensAccess(
    screens,
    ctx.user.role._id
  )
}

export async function save(ctx) {
  const appId = ctx.appId
  const db = new CouchDB(appId)
  let screen = ctx.request.body

  if (!screen._id) {
    screen._id = generateScreenID()
  }
  const response = await db.put(screen)

  ctx.message = `Screen ${screen.name} saved.`
  ctx.body = {
    ...screen,
    _id: response.id,
    _rev: response.rev,
  }
}

export async function destroy(ctx) {
  const db = new CouchDB(ctx.appId)
  await db.remove(ctx.params.screenId, ctx.params.screenRev)
  ctx.body = {
    message: "Screen deleted successfully",
  }
  ctx.status = 200
}
