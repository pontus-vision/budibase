import Router from "@koa/router"
import controller from "../../controllers/system/environment"

const router = Router()

router.get("/api/system/environment", controller.fetch)

export default router
