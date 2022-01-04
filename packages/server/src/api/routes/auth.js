import Router from "@koa/router"
import controller from "../controllers/auth"

const router = Router()

router.get("/api/self", controller.fetchSelf)

export default router
