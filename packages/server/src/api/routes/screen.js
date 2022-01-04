import Router from "@koa/router"
import controller from "../controllers/screen"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"
import joiValidator from "../../middleware/joi-validator"
import Joi from "joi"

const router = Router()

function generateSaveValidation() {
  // prettier-ignore
  return joiValidator.body(Joi.object({
    name: Joi.string().required(),
    routing: Joi.object({
      route: Joi.string().required(),
      roleId: Joi.string().required().allow(""),
    }).required().unknown(true),
    props: Joi.object({
      _id: Joi.string().required(),
      _component: Joi.string().required(),
      _children: Joi.array().required(),
      _instanceName: Joi.string().required(),
      _styles: Joi.object().required(),
      type: Joi.string().optional(),
      table: Joi.string().optional(),
      layoutId: Joi.string().optional(),
    }).required().unknown(true),
  }).unknown(true))
}

router
  .get("/api/screens", authorized(BUILDER), controller.fetch)
  .post(
    "/api/screens",
    authorized(BUILDER),
    generateSaveValidation(),
    controller.save
  )
  .delete(
    "/api/screens/:screenId/:screenRev",
    authorized(BUILDER),
    controller.destroy
  )

export default router
