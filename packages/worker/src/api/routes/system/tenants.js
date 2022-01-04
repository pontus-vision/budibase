import Router from "@koa/router"
import controller from "../../controllers/system/tenants"
import adminOnly from "../../../middleware/adminOnly"

const router = Router()

router
  .get("/api/system/tenants/:tenantId/exists", controller.exists)
  .get("/api/system/tenants", adminOnly, controller.fetch)
  .delete("/api/system/tenants/:tenantId", adminOnly, controller.delete)

export default router
