import { getConfig, afterAll as _afterAll, runStep, actions } from "./utilities"
import fetch from "node-fetch"

jest.mock("node-fetch")

describe("test the outgoing webhook action", () => {
  let inputs
  let config = getConfig()

  beforeEach(async () => {
    await config.init()
    inputs = {
      requestMethod: "POST",
      url: "www.test.com",
      requestBody: JSON.stringify({
        a: 1,
      }),
    }
  })

  afterAll(_afterAll)

  it("should be able to run the action", async () => {
    const res = await runStep(actions.OUTGOING_WEBHOOK.stepId, inputs)
    expect(res.success).toEqual(true)
    expect(res.response.url).toEqual("http://www.test.com")
    expect(res.response.method).toEqual("POST")
    expect(JSON.parse(res.response.body).a).toEqual(1)
  })

  it("should return an error if something goes wrong in fetch", async () => {
    const res = await runStep(actions.OUTGOING_WEBHOOK.stepId, {
      requestMethod: "GET",
      url: "www.invalid.com"
    })
    expect(res.success).toEqual(false)
  })

})
