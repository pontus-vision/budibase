import { join } from "./centralPath"
import { homedir } from "os"
import { BUDIBASE_DIR } from "../environment"
import { objectStore } from "@budibase/auth"
const { budibaseTempDir } = objectStore

export function budibaseAppsDir() {
  return BUDIBASE_DIR || join(homedir(), ".budibase")
}

const _budibaseTempDir = budibaseTempDir
export { _budibaseTempDir as budibaseTempDir }
