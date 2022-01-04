import { getAllApps } from "@budibase/auth/db"
import CouchDB from "../../db"

const URL_REGEX_SLASH = /\/|\\/g

export const getApps = async ctx => {
  const apps = await getAllApps(CouchDB, { dev: true })
  const body = {}
  for (let app of apps) {
    let url = app.url || encodeURI(`${app.name}`)
    url = `/${url.replace(URL_REGEX_SLASH, "")}`
    body[url] = {
      appId: app.appId,
      name: app.name,
      url,
    }
  }
  ctx.body = body
}
