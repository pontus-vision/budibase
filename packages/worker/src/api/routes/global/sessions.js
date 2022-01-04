import Router from "@koa/router"
import controller from "../../controllers/global/sessions"
import adminOnly from "../../../middleware/adminOnly"

const router = Router()

router
  .get("/api/global/sessions", adminOnly, controller.fetch)
  .get("/api/global/sessions/self", controller.selfSessions)
  .get("/api/global/sessions/:userId", adminOnly, controller.find)
  .delete("/api/global/sessions/:userId", adminOnly, controller.invalidateUser)
  .delete("/api/global/sessions/self/:sessionId", controller.invalidateSession)

export default router
