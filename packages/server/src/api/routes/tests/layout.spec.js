import { checkBuilderEndpoint } from "./utilities/TestFunctions"
import { structures, getRequest, getConfig, afterAll as _afterAll } from "./utilities"
const { basicLayout } = structures

describe("/layouts", () => {
  let request = getRequest()
  let config = getConfig()
  let layout

  afterAll(_afterAll)

  beforeEach(async () => {
    await config.init()
    layout = await config.createLayout()
  })

  describe("save", () => {
    it("should be able to create a layout", async () => {
      const res = await request
        .post(`/api/layouts`)
        .send(basicLayout())
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body._rev).toBeDefined()
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "POST",
        url: `/api/layouts`,
      })
    })
  })

  describe("destroy", () => {
    it("should be able to delete the layout", async () => {
      const res = await request
        .delete(`/api/layouts/${layout._id}/${layout._rev}`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.message).toBeDefined()
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "DELETE",
        url: `/api/layouts/${layout._id}/${layout._rev}`,
      })
    })
  })
})