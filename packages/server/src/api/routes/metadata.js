import Router from "@koa/router"
import controller from "../controllers/metadata"
import {
  middleware as appInfoMiddleware,
  AppType,
} from "../../middleware/appInfo"
import authorized from "../../middleware/authorized"
import { BUILDER } from "@budibase/auth/permissions"

const router = Router()

router
  .post(
    "/api/metadata/:type/:entityId",
    authorized(BUILDER),
    appInfoMiddleware({ appType: AppType.DEV }),
    controller.saveMetadata
  )
  .delete(
    "/api/metadata/:type/:entityId",
    authorized(BUILDER),
    appInfoMiddleware({ appType: AppType.DEV }),
    controller.deleteMetadata
  )
  .get(
    "/api/metadata/type",
    authorized(BUILDER),
    appInfoMiddleware({ appType: AppType.DEV }),
    controller.getTypes
  )
  .get(
    "/api/metadata/:type/:entityId",
    authorized(BUILDER),
    appInfoMiddleware({ appType: AppType.DEV }),
    controller.getMetadata
  )

export default router
