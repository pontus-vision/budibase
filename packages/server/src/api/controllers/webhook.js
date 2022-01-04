import CouchDB from "../../db"
import { generateWebhookID, getWebhookParams } from "../../db/utils"
import toJsonSchema from "to-json-schema"
import { validate } from "jsonschema"
import { externalTrigger } from "../../automations/triggers"
import { getDeployedAppID } from "@budibase/auth/db"

const AUTOMATION_DESCRIPTION = "Generated from Webhook Schema"

function Webhook(name, type, target) {
  this.live = true
  this.name = name
  this.action = {
    type,
    target,
  }
}

const _Webhook = Webhook
export { _Webhook as Webhook }

export const WebhookType = {
  AUTOMATION: "automation",
}

export async function fetch(ctx) {
  const db = new CouchDB(ctx.appId)
  const response = await db.allDocs(
    getWebhookParams(null, {
      include_docs: true,
    })
  )
  ctx.body = response.rows.map(row => row.doc)
}

export async function save(ctx) {
  const db = new CouchDB(ctx.appId)
  const webhook = ctx.request.body
  webhook.appId = ctx.appId

  // check that the webhook exists
  if (webhook._id) {
    await db.get(webhook._id)
  } else {
    webhook._id = generateWebhookID()
  }
  const response = await db.put(webhook)
  webhook._rev = response.rev
  ctx.body = {
    message: "Webhook created successfully",
    webhook,
  }
}

export async function destroy(ctx) {
  const db = new CouchDB(ctx.appId)
  ctx.body = await db.remove(ctx.params.id, ctx.params.rev)
}

export async function buildSchema(ctx) {
  const db = new CouchDB(ctx.params.instance)
  const webhook = await db.get(ctx.params.id)
  webhook.bodySchema = toJsonSchema(ctx.request.body)
  // update the automation outputs
  if (webhook.action.type === WebhookType.AUTOMATION) {
    let automation = await db.get(webhook.action.target)
    const autoOutputs = automation.definition.trigger.schema.outputs
    let properties = webhook.bodySchema.properties
    // reset webhook outputs
    autoOutputs.properties = {
      body: autoOutputs.properties.body,
    }
    for (let prop of Object.keys(properties)) {
      autoOutputs.properties[prop] = {
        type: properties[prop].type,
        description: AUTOMATION_DESCRIPTION,
      }
    }
    await db.put(automation)
  }
  ctx.body = await db.put(webhook)
}

export async function trigger(ctx) {
  const prodAppId = getDeployedAppID(ctx.params.instance)
  try {
    const db = new CouchDB(prodAppId)
    const webhook = await db.get(ctx.params.id)
    // validate against the schema
    if (webhook.bodySchema) {
      validate(ctx.request.body, webhook.bodySchema)
    }
    const target = await db.get(webhook.action.target)
    if (webhook.action.type === WebhookType.AUTOMATION) {
      // trigger with both the pure request and then expand it
      // incase the user has produced a schema to bind to
      await externalTrigger(target, {
        body: ctx.request.body,
        ...ctx.request.body,
        appId: prodAppId,
      })
    }
    ctx.status = 200
    ctx.body = {
      message: "Webhook trigger fired successfully",
    }
  } catch (err) {
    if (err.status === 404) {
      ctx.status = 200
      ctx.body = {
        message: "Application not deployed yet.",
      }
    }
  }
}
