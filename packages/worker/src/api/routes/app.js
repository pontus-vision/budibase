import Router from "@koa/router"
import controller from "../controllers/app"

const router = Router()

router.get("/api/apps", controller.getApps)

export default router
