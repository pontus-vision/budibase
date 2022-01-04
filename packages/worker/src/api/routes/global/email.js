import Router from "@koa/router"
import controller from "../../controllers/global/email"
import { EmailTemplatePurpose } from "../../../constants"
import joiValidator from "../../../middleware/joi-validator"
import adminOnly from "../../../middleware/adminOnly"
import Joi from "joi"

const router = Router()

function buildEmailSendValidation() {
  // prettier-ignore
  return joiValidator.body(Joi.object({
    email: Joi.string().email(),
    purpose: Joi.string().valid(...Object.values(EmailTemplatePurpose)),
    workspaceId: Joi.string().allow("", null),
    from: Joi.string().allow("", null),
    contents: Joi.string().allow("", null),
    subject: Joi.string().allow("", null),
  }).required().unknown(true))
}

router.post(
  "/api/global/email/send",
  buildEmailSendValidation(),
  adminOnly,
  controller.sendEmail
)

export default router
