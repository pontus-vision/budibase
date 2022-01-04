import Router from "@koa/router"
import controller from "../controllers/deploy"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router
  .get("/api/deployments", authorized(BUILDER), controller.fetchDeployments)
  .get(
    "/api/deploy/:deploymentId",
    authorized(BUILDER),
    controller.deploymentProgress
  )
  .post("/api/deploy", authorized(BUILDER), controller.deployApp)

export default router
