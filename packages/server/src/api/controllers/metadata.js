import { MetadataTypes } from "../../constants"
import CouchDB from "../../db"
import { generateMetadataID } from "../../db/utils"
import { saveEntityMetadata, deleteEntityMetadata } from "../../utilities"

export async function getTypes(ctx) {
  ctx.body = {
    types: MetadataTypes,
  }
}

export async function saveMetadata(ctx) {
  const { type, entityId } = ctx.params
  if (type === MetadataTypes.AUTOMATION_TEST_HISTORY) {
    ctx.throw(400, "Cannot save automation history type")
  }
  ctx.body = await saveEntityMetadata(
    ctx.appId,
    type,
    entityId,
    ctx.request.body
  )
}

export async function deleteMetadata(ctx) {
  const { type, entityId } = ctx.params
  await deleteEntityMetadata(ctx.appId, type, entityId)
  ctx.body = {
    message: "Metadata deleted successfully",
  }
}

export async function getMetadata(ctx) {
  const { type, entityId } = ctx.params
  const db = new CouchDB(ctx.appId)
  const id = generateMetadataID(type, entityId)
  try {
    ctx.body = await db.get(id)
  } catch (err) {
    if (err.status === 404) {
      ctx.body = {}
    } else {
      ctx.throw(err.status, err)
    }
  }
}
