import Router from "@koa/router"
import controller from "../controllers/webhook"
import authorized from "../../middleware/authorized"
import joiValidator from "../../middleware/joi-validator"
import { BUILDER } from "@budibase/auth/permissions"
import Joi from "joi"

const router = Router()

function generateSaveValidator() {
  // prettier-ignore
  return joiValidator.body(Joi.object({
    live: Joi.bool(),
    _id: Joi.string().optional(),
    _rev: Joi.string().optional(),
    name: Joi.string().required(),
    bodySchema: Joi.object().optional(),
    action: Joi.object({
      type: Joi.string().required().valid(controller.WebhookType.AUTOMATION),
      target: Joi.string().required(),
    }).required(),
  }).unknown(true))
}

router
  .get("/api/webhooks", authorized(BUILDER), controller.fetch)
  .put(
    "/api/webhooks",
    authorized(BUILDER),
    generateSaveValidator(),
    controller.save
  )
  .delete("/api/webhooks/:id/:rev", authorized(BUILDER), controller.destroy)
  .post(
    "/api/webhooks/schema/:instance/:id",
    authorized(BUILDER),
    controller.buildSchema
  )
  // this shouldn't have authorisation, right now its always public
  .post("/api/webhooks/trigger/:instance/:id", controller.trigger)

export default router
