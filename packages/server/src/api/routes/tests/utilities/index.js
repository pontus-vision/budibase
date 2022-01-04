import TestConfig from "../../../../tests/utilities/TestConfiguration"
import structures from "../../../../tests/utilities/structures"
import env from "../../../../environment"

jest.mock("../../../../utilities/workerRequests", () => ({
  getGlobalUsers: jest.fn(() => {
    return {
      _id: "us_uuid1",
    }
  }),
  getGlobalSelf: jest.fn(() => {
    return {
      _id: "us_uuid1",
    }
  }),
  removeAppFromUserRoles: jest.fn(),
}))

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let request, config

export const beforeAll = () => {
  config = new TestConfig()
  request = config.getRequest()
}

export const afterAll = () => {
  if (config) {
    config.end()
  }
  // clear app files

  request = null
  config = null
}

export const getRequest = () => {
  if (!request) {
    beforeAll()
  }
  return request
}

export const getConfig = () => {
  if (!config) {
    beforeAll()
  }
  return config
}

export const switchToSelfHosted = async func => {
  // self hosted stops any attempts to Dynamo
  env._set("NODE_ENV", "production")
  env._set("SELF_HOSTED", true)
  let error
  try {
    await func()
  } catch (err) {
    error = err
  }
  env._set("NODE_ENV", "jest")
  env._set("SELF_HOSTED", false)
  // don't throw error until after reset
  if (error) {
    throw error
  }
}

export { structures }
