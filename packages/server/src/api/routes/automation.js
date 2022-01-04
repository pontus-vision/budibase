import Router from "@koa/router"
import controller from "../controllers/automation"
import authorized from "../../middleware/authorized"
import joiValidator from "../../middleware/joi-validator"
import {
  BUILDER,
  PermissionLevels,
  PermissionTypes,
} from "@budibase/auth/permissions"
import Joi from "joi"
import { bodyResource, paramResource } from "../../middleware/resourceId"
import {
  middleware as appInfoMiddleware,
  AppType,
} from "../../middleware/appInfo"

const router = Router()

// prettier-ignore
function generateStepSchema(allowStepTypes) {
  return Joi.object({
    stepId: Joi.string().required(),
    id: Joi.string().required(),
    description: Joi.string().required(),
    name: Joi.string().required(),
    tagline: Joi.string().required(),
    icon: Joi.string().required(),
    params: Joi.object(),
    args: Joi.object(),
    type: Joi.string().required().valid(...allowStepTypes),
  }).unknown(true)
}

function generateValidator(existing = false) {
  // prettier-ignore
  return joiValidator.body(Joi.object({
    _id: existing ? Joi.string().required() : Joi.string(),
    _rev: existing ? Joi.string().required() : Joi.string(),
    name: Joi.string().required(),
    type: Joi.string().valid("automation").required(),
    definition: Joi.object({
      steps: Joi.array().required().items(generateStepSchema(["ACTION", "LOGIC"])),
      trigger: generateStepSchema(["TRIGGER"]).allow(null),
    }).required().unknown(true),
  }).unknown(true))
}

router
  .get(
    "/api/automations/trigger/list",
    authorized(BUILDER),
    controller.getTriggerList
  )
  .get(
    "/api/automations/action/list",
    authorized(BUILDER),
    controller.getActionList
  )
  .get(
    "/api/automations/definitions/list",
    authorized(BUILDER),
    controller.getDefinitionList
  )
  .get("/api/automations", authorized(BUILDER), controller.fetch)
  .get(
    "/api/automations/:id",
    paramResource("id"),
    authorized(BUILDER),
    controller.find
  )
  .put(
    "/api/automations",
    bodyResource("_id"),
    authorized(BUILDER),
    generateValidator(true),
    controller.update
  )
  .post(
    "/api/automations",
    authorized(BUILDER),
    generateValidator(false),
    controller.create
  )
  .delete(
    "/api/automations/:id/:rev",
    paramResource("id"),
    authorized(BUILDER),
    controller.destroy
  )
  .post(
    "/api/automations/:id/trigger",
    appInfoMiddleware({ appType: AppType.PROD }),
    paramResource("id"),
    authorized(PermissionTypes.AUTOMATION, PermissionLevels.EXECUTE),
    controller.trigger
  )
  .post(
    "/api/automations/:id/test",
    appInfoMiddleware({ appType: AppType.DEV }),
    paramResource("id"),
    authorized(PermissionTypes.AUTOMATION, PermissionLevels.EXECUTE),
    controller.test
  )

export default router
