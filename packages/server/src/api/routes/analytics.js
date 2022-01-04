import Router from "@koa/router"
import controller from "../controllers/analytics"

const router = Router()

router
  .get("/api/analytics", controller.isEnabled)
  .post("/api/analytics/ping", controller.endUserPing)

export default router
