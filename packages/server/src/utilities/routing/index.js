import CouchDB from "../../db"
import { createRoutingView } from "../../db/views/staticViews"
import { ViewNames, getQueryIndex, UNICODE_MAX } from "../../db/utils"

export const getRoutingInfo = async appId => {
  const db = new CouchDB(appId)
  try {
    const allRouting = await db.query(getQueryIndex(ViewNames.ROUTING), {
      startKey: "",
      endKey: UNICODE_MAX,
    })
    return allRouting.rows.map(row => row.value)
  } catch (err) {
    // check if the view doesn't exist, it should for all new instances
    /* istanbul ignore next */
    if (err != null && err.name === "not_found") {
      await createRoutingView(appId)
      return getRoutingInfo(appId)
    } else {
      throw err
    }
  }
}

export { createRoutingView }
