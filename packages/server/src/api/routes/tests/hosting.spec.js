// mock out node fetch for this
jest.mock("node-fetch")

import { checkBuilderEndpoint } from "./utilities/TestFunctions"
import { getRequest, getConfig, afterAll as _afterAll } from "./utilities"

describe("/hosting", () => {
  let request = getRequest()
  let config = getConfig()
  let app

  afterAll(_afterAll)

  beforeEach(async () => {
    app = await config.init()
  })

  describe("fetchUrls", () => {
    it("should be able to fetch current app URLs", async () => {
      const res = await request
        .get(`/api/hosting/urls`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.app).toEqual(`http://localhost:10000/app`)
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "GET",
        url: `/api/hosting/urls`,
      })
    })
  })
})