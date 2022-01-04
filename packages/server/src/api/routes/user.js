import Router from "@koa/router"
import controller from "../controllers/user"
import authorized from "../../middleware/authorized"
import { PermissionLevels, PermissionTypes } from "@budibase/auth/permissions"

const router = Router()

router
  .get(
    "/api/users/metadata",
    authorized(PermissionTypes.USER, PermissionLevels.READ),
    controller.fetchMetadata
  )
  .get(
    "/api/users/metadata/:id",
    authorized(PermissionTypes.USER, PermissionLevels.READ),
    controller.findMetadata
  )
  .put(
    "/api/users/metadata",
    authorized(PermissionTypes.USER, PermissionLevels.WRITE),
    controller.updateMetadata
  )
  .post(
    "/api/users/metadata/self",
    authorized(PermissionTypes.USER, PermissionLevels.WRITE),
    controller.updateSelfMetadata
  )
  .delete(
    "/api/users/metadata/:id",
    authorized(PermissionTypes.USER, PermissionLevels.WRITE),
    controller.destroyMetadata
  )
  .post(
    "/api/users/metadata/sync/:id",
    authorized(PermissionTypes.USER, PermissionLevels.WRITE),
    controller.syncUser
  )
  .post(
    "/api/users/flags",
    authorized(PermissionTypes.USER, PermissionLevels.WRITE),
    controller.setFlag
  )
  .get(
    "/api/users/flags",
    authorized(PermissionTypes.USER, PermissionLevels.READ),
    controller.getFlags
  )

export default router
