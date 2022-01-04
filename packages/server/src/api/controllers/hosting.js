import CouchDB from "../../db"
import { getDeployedApps } from "../../utilities/workerRequests"
import { getScopedConfig } from "@budibase/auth/db"
import { constants } from "@budibase/auth"
const { Configs } = constants
import { checkSlashesInUrl } from "../../utilities"

export async function fetchUrls(ctx) {
  const appId = ctx.appId
  const db = new CouchDB(appId)
  const settings = await getScopedConfig(db, { type: Configs.SETTINGS })
  let appUrl = "http://localhost:10000/app"
  if (settings && settings["platformUrl"]) {
    appUrl = checkSlashesInUrl(`${settings["platformUrl"]}/app`)
  }
  ctx.body = {
    app: appUrl,
  }
}

const _getDeployedApps = async ctx => {
  ctx.body = await getDeployedApps()
}
export { _getDeployedApps as getDeployedApps }
