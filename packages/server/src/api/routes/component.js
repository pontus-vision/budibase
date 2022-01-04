import Router from "@koa/router"
import controller from "../controllers/component"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router.get(
  "/api/:appId/components/definitions",
  authorized(BUILDER),
  controller.fetchAppComponentDefinitions
)

export default router
