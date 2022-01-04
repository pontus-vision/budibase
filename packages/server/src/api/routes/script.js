import Router from "@koa/router"
import controller from "../controllers/script"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router.post("/api/script", authorized(BUILDER), controller.save)

export default router
