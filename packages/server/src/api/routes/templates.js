import Router from "@koa/router"
import controller from "../controllers/templates"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router
  .get("/api/templates", authorized(BUILDER), controller.fetch)
  .get(
    "/api/templates/:type/:name",
    authorized(BUILDER),
    controller.downloadTemplate
  )

export default router
