import Router from "@koa/router"
import controller from "../controllers/dev"
import env from "../../environment"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

function redirectPath(path) {
  router
    .get(`/api/${path}/:devPath(.*)`, controller.buildRedirectGet(path))
    .post(`/api/${path}/:devPath(.*)`, controller.buildRedirectPost(path))
    .delete(`/api/${path}/:devPath(.*)`, controller.buildRedirectDelete(path))
}

if (env.isDev() || env.isTest()) {
  redirectPath("global")
  redirectPath("system")
}

router
  .get("/api/dev/version", authorized(BUILDER), controller.getBudibaseVersion)
  .delete("/api/dev/:appId/lock", authorized(BUILDER), controller.clearLock)
  .post("/api/dev/:appId/revert", authorized(BUILDER), controller.revert)

export default router
