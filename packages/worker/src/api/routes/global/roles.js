import Router from "@koa/router"
import controller from "../../controllers/global/roles"
import adminOnly from "../../../middleware/adminOnly"

const router = Router()

router
  .get("/api/global/roles", adminOnly, controller.fetch)
  .get("/api/global/roles/:appId", adminOnly, controller.find)

export default router
