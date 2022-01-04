import Router from "@koa/router"
import viewController from "../controllers/view"
import rowController from "../controllers/row"
import authorized from "../../middleware/authorized"
import { paramResource } from "../../middleware/resourceId"
import {
  BUILDER,
  PermissionTypes,
  PermissionLevels,
} from "@budibase/auth/permissions"

const router = Router()

router
  .get("/api/views/export", authorized(BUILDER), viewController.exportView)
  .get(
    "/api/views/:viewName",
    paramResource("viewName"),
    authorized(PermissionTypes.VIEW, PermissionLevels.READ),
    rowController.fetchView
  )
  .get("/api/views", authorized(BUILDER), viewController.fetch)
  .delete(
    "/api/views/:viewName",
    paramResource("viewName"),
    authorized(BUILDER),
    viewController.destroy
  )
  .post("/api/views", authorized(BUILDER), viewController.save)

export default router
