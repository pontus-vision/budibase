import TestConfig from "../../../tests/utilities/TestConfiguration"
import { ACTION_DEFINITIONS, getAction } from "../../actions"
import emitter from "../../../events/index"
import env from "../../../environment"

let config

export const getConfig = () => {
  if (!config) {
    config = new TestConfig(false)
  }
  return config
}

export const afterAll = () => {
  config.end()
}

export const runInProd = async fn => {
  env._set("NODE_ENV", "production")
  env._set("USE_QUOTAS", 1)
  let error
  try {
    await fn()
  } catch (err) {
    error = err
  }
  env._set("NODE_ENV", "jest")
  env._set("USE_QUOTAS", null)
  if (error) {
    throw error
  }
}

export const runStep = async function runStep(stepId, inputs) {
  let step = await getAction(stepId)
  expect(step).toBeDefined()
  return step({
    inputs,
    appId: config ? config.getAppId() : null,
    // don't really need an API key, mocked out usage quota, not being tested here
    apiKey: exports.apiKey,
    emitter,
  })
}

export const apiKey = "test"
export const actions = ACTION_DEFINITIONS
