import { readFileSync } from "fs"

export const readStaticFile = path => {
  return readFileSync(path, "utf-8")
}
