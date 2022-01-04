import env from "../environment"
import CouchDB from "../db"
import { init } from "@budibase/auth"

export const threadSetup = () => {
  // don't run this if not threading
  if (env.isTest() || env.DISABLE_THREADING) {
    return
  }
  // when thread starts, make sure it is recorded
  env.setInThread()
  init(CouchDB)
}
