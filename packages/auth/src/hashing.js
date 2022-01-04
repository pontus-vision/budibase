import bcrypt from "bcryptjs"
import env from "./environment"
import { v4 } from "uuid"

const SALT_ROUNDS = env.SALT_ROUNDS || 10

export const hash = async data => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(data, salt)
}

export const compare = async (data, encrypted) => {
  return bcrypt.compare(data, encrypted)
}

export const newid = function () {
  return v4().replace(/-/g, "")
}
