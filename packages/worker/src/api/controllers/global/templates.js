import { generateTemplateID } from "@budibase/auth/db"
import {
  TemplateMetadata,
  TemplateBindings,
  GLOBAL_OWNER,
} from "../../../constants"
import { getTemplates } from "../../../constants/templates"
import { getGlobalDB } from "@budibase/auth/tenancy"

export const save = async ctx => {
  const db = getGlobalDB()
  let template = ctx.request.body
  if (!template.ownerId) {
    template.ownerId = GLOBAL_OWNER
  }
  if (!template._id) {
    template._id = generateTemplateID(template.ownerId)
  }

  const response = await db.put(template)
  ctx.body = {
    ...template,
    _rev: response.rev,
  }
}

export const definitions = async ctx => {
  const bindings = {}
  const info = {}
  for (let template of TemplateMetadata.email) {
    bindings[template.purpose] = template.bindings
    info[template.purpose] = {
      name: template.name,
      description: template.description,
      category: template.category,
    }
  }

  ctx.body = {
    info,
    bindings: {
      ...bindings,
      common: Object.values(TemplateBindings),
    },
  }
}

export const fetch = async ctx => {
  ctx.body = await getTemplates()
}

export const fetchByType = async ctx => {
  ctx.body = await getTemplates({
    type: ctx.params.type,
  })
}

export const fetchByOwner = async ctx => {
  ctx.body = await getTemplates({
    ownerId: ctx.params.ownerId,
  })
}

export const find = async ctx => {
  ctx.body = await getTemplates({
    id: ctx.params.id,
  })
}

export const destroy = async ctx => {
  const db = getGlobalDB()
  await db.remove(ctx.params.id, ctx.params.rev)
  ctx.message = `Template ${ctx.params.id} deleted.`
  ctx.status = 200
}
