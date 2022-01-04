import Router from "@koa/router"
import queryController from "../controllers/query"
import authorized from "../../middleware/authorized"
import {
  PermissionLevels,
  PermissionTypes,
  BUILDER,
} from "@budibase/auth/permissions"
import {
  bodyResource,
  bodySubResource,
  paramResource,
} from "../../middleware/resourceId"
import {
  generateQueryPreviewValidation,
  generateQueryValidation,
} from "../controllers/query/validation"

const router = Router()

router
  .get("/api/queries", authorized(BUILDER), queryController.fetch)
  .post(
    "/api/queries",
    bodySubResource("datasourceId", "_id"),
    authorized(BUILDER),
    generateQueryValidation(),
    queryController.save
  )
  .post("/api/queries/import", authorized(BUILDER), queryController.import)
  .post(
    "/api/queries/preview",
    bodyResource("datasourceId"),
    authorized(BUILDER),
    generateQueryPreviewValidation(),
    queryController.preview
  )
  .get(
    "/api/queries/:queryId",
    paramResource("queryId"),
    authorized(PermissionTypes.QUERY, PermissionLevels.READ),
    queryController.find
  )
  .post(
    "/api/queries/:queryId",
    paramResource("queryId"),
    authorized(PermissionTypes.QUERY, PermissionLevels.WRITE),
    queryController.execute
  )
  .delete(
    "/api/queries/:queryId/:revId",
    paramResource("queryId"),
    authorized(BUILDER),
    queryController.destroy
  )

export default router
