import { checkBuilderEndpoint } from "./utilities/TestFunctions"
import { getRequest, getConfig, afterAll as _afterAll } from "./utilities"

describe("/integrations", () => {
  let request = getRequest()
  let config = getConfig()

  afterAll(_afterAll)

  beforeEach(async () => {
    await config.init()
  })

  describe("fetch", () => {
    it("should be able to get all integration definitions", async () => {
      const res = await request
        .get(`/api/integrations`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.POSTGRES).toBeDefined()
      expect(res.body.POSTGRES.friendlyName).toEqual("PostgreSQL")
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "GET",
        url: `/api/integrations`,
      })
    })
  })

  describe("find", () => {
    it("should be able to get postgres definition", async () => {
      const res = await request
        .get(`/api/integrations/POSTGRES`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.friendlyName).toEqual("PostgreSQL")
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "GET",
        url: `/api/integrations/POSTGRES`,
      })
    })
  })
})