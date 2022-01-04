import { getRequest, getConfig, afterAll as _afterAll } from "./utilities"
import { generateUserMetadataID } from "../../../db/utils"

describe("/authenticate", () => {
  let request = getRequest()
  let config = getConfig()

  afterAll(_afterAll)

  beforeEach(async () => {
    await config.init()
  })

  describe("fetch self", () => {
    it("should be able to fetch self", async () => {
      const headers = await config.login()
      const res = await request
        .get(`/api/self`)
        .set(headers)
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body._id).toEqual(generateUserMetadataID("us_uuid1"))
    })
  })
})