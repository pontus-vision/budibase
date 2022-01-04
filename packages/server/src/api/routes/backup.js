import Router from "@koa/router"
import controller from "../controllers/backup"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router.get("/api/backups/export", authorized(BUILDER), controller.exportAppDump)

export default router
