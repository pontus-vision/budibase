import Router from "@koa/router"
import controller from "../controllers/hosting"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router
  .get("/api/hosting/urls", authorized(BUILDER), controller.fetchUrls)
  // this isn't risky, doesn't return anything about apps other than names and URLs
  .get("/api/hosting/apps", controller.getDeployedApps)

export default router
