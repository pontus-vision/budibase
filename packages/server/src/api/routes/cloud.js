import Router from "@koa/router"
import controller from "../controllers/cloud"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router
  .get("/api/cloud/export", authorized(BUILDER), controller.exportApps)
  // has to be public, only run if apps don't exist
  .post("/api/cloud/import", controller.importApps)
  .get("/api/cloud/import/complete", controller.hasBeenImported)

export default router
