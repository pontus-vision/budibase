import { getWorkspaceParams, generateWorkspaceID } from "@budibase/auth/db"
import { getGlobalDB } from "@budibase/auth/tenancy"

export const save = async function (ctx) {
  const db = getGlobalDB()
  const workspaceDoc = ctx.request.body

  // workspace does not exist yet
  if (!workspaceDoc._id) {
    workspaceDoc._id = generateWorkspaceID()
  }

  try {
    const response = await db.put(workspaceDoc)
    ctx.body = {
      _id: response.id,
      _rev: response.rev,
    }
  } catch (err) {
    ctx.throw(err.status, err)
  }
}

export const fetch = async function (ctx) {
  const db = getGlobalDB()
  const response = await db.allDocs(
    getWorkspaceParams(undefined, {
      include_docs: true,
    })
  )
  ctx.body = response.rows.map(row => row.doc)
}

export const find = async function (ctx) {
  const db = getGlobalDB()
  try {
    ctx.body = await db.get(ctx.params.id)
  } catch (err) {
    ctx.throw(err.status, err)
  }
}

export const destroy = async function (ctx) {
  const db = getGlobalDB()
  const { id, rev } = ctx.params

  try {
    await db.remove(id, rev)
    ctx.body = { message: "Workspace deleted successfully" }
  } catch (err) {
    ctx.throw(err.status, err)
  }
}
