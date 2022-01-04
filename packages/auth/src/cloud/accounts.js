import API from "./api"
import env from "../environment"
import { Headers } from "../constants"

const api = new API(env.ACCOUNT_PORTAL_URL)

export const getAccount = async email => {
  const payload = {
    email,
  }
  const response = await api.post(`/api/accounts/search`, {
    body: payload,
    headers: {
      [Headers.API_KEY]: env.ACCOUNT_PORTAL_API_KEY,
    },
  })
  const json = await response.json()

  if (response.status !== 200) {
    throw Error(`Error getting account by email ${email}`, json)
  }

  return json[0]
}
