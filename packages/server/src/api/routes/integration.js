import Router from "@koa/router"
import controller from "../controllers/integration"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router
  .get("/api/integrations", authorized(BUILDER), controller.fetch)
  .get("/api/integrations/:type", authorized(BUILDER), controller.find)

export default router
