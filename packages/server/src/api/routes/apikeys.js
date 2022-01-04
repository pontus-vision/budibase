import Router from "@koa/router"
import controller from "../controllers/apikeys"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router
  .get("/api/keys", authorized(BUILDER), controller.fetch)
  .put("/api/keys/:key", authorized(BUILDER), controller.update)

export default router
