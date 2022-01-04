import { checkBuilderEndpoint } from "./utilities/TestFunctions"
import { getRequest, getConfig, afterAll as _afterAll } from "./utilities"

describe("/component", () => {
  let request = getRequest()
  let config = getConfig()

  afterAll(_afterAll)

  beforeEach(async () => {
    await config.init()
  })

  describe("fetch definitions", () => {
    it("should be able to fetch definitions", async () => {
      const res = await request
        .get(`/api/${config.getAppId()}/components/definitions`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body["@budibase/standard-components/container"]).toBeDefined()
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "GET",
        url: `/api/${config.getAppId()}/components/definitions`,
      })
    })
  })
})