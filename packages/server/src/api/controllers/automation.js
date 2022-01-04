import CouchDB from "../../db"
import { ACTION_DEFINITIONS } from "../../automations/actions"
import {
  TRIGGER_DEFINITIONS,
  externalTrigger,
} from "../../automations/triggers"
import { getAutomationParams, generateAutomationID } from "../../db/utils"
import {
  checkForWebhooks,
  updateTestHistory,
  removeDeprecated,
} from "../../automations/utils"
import { deleteEntityMetadata } from "../../utilities"
import { MetadataTypes } from "../../constants"
import { setTestFlag, clearTestFlag } from "../../utilities/redis"

const ACTION_DEFS = removeDeprecated(ACTION_DEFINITIONS)
const TRIGGER_DEFS = removeDeprecated(TRIGGER_DEFINITIONS)

/*************************
 *                       *
 *   BUILDER FUNCTIONS   *
 *                       *
 *************************/

async function cleanupAutomationMetadata(appId, automationId) {
  await deleteEntityMetadata(
    appId,
    MetadataTypes.AUTOMATION_TEST_INPUT,
    automationId
  )
  await deleteEntityMetadata(
    appId,
    MetadataTypes.AUTOMATION_TEST_HISTORY,
    automationId
  )
}

function cleanAutomationInputs(automation) {
  if (automation == null) {
    return automation
  }
  let steps = automation.definition.steps
  let trigger = automation.definition.trigger
  let allSteps = [...steps, trigger]
  // live is not a property used anymore
  if (automation.live != null) {
    delete automation.live
  }
  for (let step of allSteps) {
    if (step == null) {
      continue
    }
    for (let inputName of Object.keys(step.inputs)) {
      if (!step.inputs[inputName] || step.inputs[inputName] === "") {
        delete step.inputs[inputName]
      }
    }
  }
  return automation
}

export async function create(ctx) {
  const db = new CouchDB(ctx.appId)
  let automation = ctx.request.body
  automation.appId = ctx.appId

  // call through to update if already exists
  if (automation._id && automation._rev) {
    return update(ctx)
  }

  automation._id = generateAutomationID()

  automation.type = "automation"
  automation = cleanAutomationInputs(automation)
  automation = await checkForWebhooks({
    appId: ctx.appId,
    newAuto: automation,
  })
  const response = await db.put(automation)
  automation._rev = response.rev

  ctx.status = 200
  ctx.body = {
    message: "Automation created successfully",
    automation: {
      ...automation,
      ...response,
    },
  }
}

export async function update(ctx) {
  const db = new CouchDB(ctx.appId)
  let automation = ctx.request.body
  automation.appId = ctx.appId
  const oldAutomation = await db.get(automation._id)
  automation = cleanAutomationInputs(automation)
  automation = await checkForWebhooks({
    appId: ctx.appId,
    oldAuto: oldAutomation,
    newAuto: automation,
  })
  const response = await db.put(automation)
  automation._rev = response.rev

  const oldAutoTrigger =
    oldAutomation && oldAutomation.definition.trigger
      ? oldAutomation.definition.trigger
      : {}
  const newAutoTrigger =
    automation && automation.definition.trigger
      ? automation.definition.trigger
      : {}
  // trigger has been updated, remove the test inputs
  if (oldAutoTrigger.id !== newAutoTrigger.id) {
    await deleteEntityMetadata(
      ctx.appId,
      MetadataTypes.AUTOMATION_TEST_INPUT,
      automation._id
    )
  }

  ctx.status = 200
  ctx.body = {
    message: `Automation ${automation._id} updated successfully.`,
    automation: {
      ...automation,
      _rev: response.rev,
      _id: response.id,
    },
  }
}

export async function fetch(ctx) {
  const db = new CouchDB(ctx.appId)
  const response = await db.allDocs(
    getAutomationParams(null, {
      include_docs: true,
    })
  )
  ctx.body = response.rows.map(row => row.doc)
}

export async function find(ctx) {
  const db = new CouchDB(ctx.appId)
  ctx.body = await db.get(ctx.params.id)
}

export async function destroy(ctx) {
  const db = new CouchDB(ctx.appId)
  const automationId = ctx.params.id
  const oldAutomation = await db.get(automationId)
  await checkForWebhooks({
    appId: ctx.appId,
    oldAuto: oldAutomation,
  })
  // delete metadata first
  await cleanupAutomationMetadata(ctx.appId, automationId)
  ctx.body = await db.remove(automationId, ctx.params.rev)
}

export async function getActionList(ctx) {
  ctx.body = ACTION_DEFS
}

export async function getTriggerList(ctx) {
  ctx.body = TRIGGER_DEFS
}

export async function getDefinitionList(ctx) {
  ctx.body = {
    trigger: TRIGGER_DEFS,
    action: ACTION_DEFS,
  }
}

/*********************
 *                   *
 *   API FUNCTIONS   *
 *                   *
 *********************/

export async function trigger(ctx) {
  const appId = ctx.appId
  const db = new CouchDB(appId)
  let automation = await db.get(ctx.params.id)
  await externalTrigger(automation, {
    ...ctx.request.body,
    appId,
  })
  ctx.body = {
    message: `Automation ${automation._id} has been triggered.`,
    automation,
  }
}

function prepareTestInput(input) {
  // prepare the test parameters
  if (input.id && input.row) {
    input.row._id = input.id
  }
  if (input.revision && input.row) {
    input.row._rev = input.revision
  }
  return input
}

export async function test(ctx) {
  const appId = ctx.appId
  const db = new CouchDB(appId)
  let automation = await db.get(ctx.params.id)
  await setTestFlag(automation._id)
  const testInput = prepareTestInput(ctx.request.body)
  const response = await externalTrigger(
    automation,
    {
      ...testInput,
      appId,
    },
    { getResponses: true }
  )
  // save a test history run
  await updateTestHistory(ctx.appId, automation, {
    ...ctx.request.body,
    occurredAt: new Date().getTime(),
  })
  await clearTestFlag(automation._id)
  ctx.body = response
}
