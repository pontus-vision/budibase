import { join } from "path"
import { tmpdir } from "os"

export const ObjectStoreBuckets = {
  BACKUPS: "backups",
  APPS: "prod-budi-app-assets",
  TEMPLATES: "templates",
  GLOBAL: "global",
  GLOBAL_CLOUD: "prod-budi-tenant-uploads",
}

export const budibaseTempDir = function () {
  return join(process.env.BUDIBASE_TMP_DIR || tmpdir(), ".budibase")
}
