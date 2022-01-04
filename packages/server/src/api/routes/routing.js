import Router from "@koa/router"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"
import controller from "../controllers/routing"

const router = Router()

router
  // gets correct structure for user role
  .get("/api/routing/client", controller.clientFetch)
  // gets the full structure, not just the correct screen ID for user role
  .get("/api/routing", authorized(BUILDER), controller.fetch)

export default router
