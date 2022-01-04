import Router from "@koa/router"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"
import controller from "../controllers/layout"

const router = Router()

router
  .post("/api/layouts", authorized(BUILDER), controller.save)
  .delete(
    "/api/layouts/:layoutId/:layoutRev",
    authorized(BUILDER),
    controller.destroy
  )

export default router
