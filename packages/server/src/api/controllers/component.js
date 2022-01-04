import CouchDB from "../../db"
import { DocumentTypes } from "../../db/utils"
import { getComponentLibraryManifest } from "../../utilities/fileSystem"

export async function fetchAppComponentDefinitions(ctx) {
  const appId = ctx.params.appId || ctx.appId
  const db = new CouchDB(appId)
  const app = await db.get(DocumentTypes.APP_METADATA)

  let componentManifests = await Promise.all(
    app.componentLibraries.map(async library => {
      let manifest = await getComponentLibraryManifest(appId, library)

      return {
        manifest,
        library,
      }
    })
  )
  const definitions = {}
  for (let { manifest, library } of componentManifests) {
    for (let key of Object.keys(manifest)) {
      if (key === "features") {
        definitions[key] = manifest[key]
      } else {
        const fullComponentName = `${library}/${key}`.toLowerCase()
        definitions[fullComponentName] = {
          component: fullComponentName,
          ...manifest[key],
        }
      }
    }
  }
  ctx.body = definitions
}
