// TODO: REMOVE

import bcrypt from "bcryptjs"

import env from "../environment"

const SALT_ROUNDS = env.SALT_ROUNDS || 10

export const hash = async data => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  const result = await bcrypt.hash(data, salt)
  return result
}

export const compare = async (data, encrypted) =>
  await bcrypt.compare(data, encrypted)
