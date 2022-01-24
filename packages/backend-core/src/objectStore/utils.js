const { join } = require("path")
const { tmpdir } = require("os")

const bucketPrefix = process.env.S3_BUCKET_PREFIX || ""
exports.ObjectStoreBuckets = {
  BACKUPS: `${bucketPrefix}backups`,
  APPS: `${bucketPrefix}prod-budi-app-assets`,
  TEMPLATES: `${bucketPrefix}templates`,
  GLOBAL: `${bucketPrefix}global`,
  GLOBAL_CLOUD: `${bucketPrefix}prod-budi-tenant-uploads`,
}

exports.budibaseTempDir = function () {
  return join(tmpdir(), ".budibase")
}
