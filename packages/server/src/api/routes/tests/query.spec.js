// Mock out postgres for this
jest.mock("pg")

// Mock isProdAppID to we can later mock the implementation and pretend we are
// using prod app IDs
import authDb, { isProdAppID as _isProdAppID } from "@budibase/auth/db"
const { isProdAppID } = authDb
const mockIsProdAppID = jest.fn(isProdAppID)
_isProdAppID = mockIsProdAppID

import { structures, getRequest, getConfig, afterAll as _afterAll, switchToSelfHosted } from "./utilities"
import { checkBuilderEndpoint } from "./utilities/TestFunctions"
const { basicQuery, basicDatasource } = structures

describe("/queries", () => {
  let request = getRequest()
  let config = getConfig()
  let datasource, query

  afterAll(_afterAll)

  beforeEach(async () => {
    await config.init()
    datasource = await config.createDatasource()
    query = await config.createQuery()
  })

  async function createInvalidIntegration() {
    const datasource = await config.createDatasource({
      datasource: {
        ...basicDatasource().datasource,
        source: "INVALID_INTEGRATION",
      },
    })
    const query = await config.createQuery()
    return { datasource, query }
  }

  describe("create", () => {
    it("should create a new query", async () => {
      const { _id } = await config.createDatasource()
      const query = basicQuery(_id)
      const res = await request
        .post(`/api/queries`)
        .send(query)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)

      expect(res.res.statusMessage).toEqual(
        `Query ${query.name} saved successfully.`
      )
      expect(res.body).toEqual({
        _rev: res.body._rev,
        _id: res.body._id,
        ...query,
      })
    })
  })

  describe("fetch", () => {
    it("returns all the queries from the server", async () => {
      const res = await request
        .get(`/api/queries`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)

      const queries = res.body
      expect(queries).toEqual([
        {
          _rev: query._rev,
          _id: query._id,
          ...basicQuery(datasource._id),
          readable: true,
        },
      ])
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "GET",
        url: `/api/datasources`,
      })
    })
  })

  describe("find", () => {
    it("should find a query in builder", async () => {
      const query = await config.createQuery()
      const res = await request
        .get(`/api/queries/${query._id}`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body._id).toEqual(query._id)
    })

    it("should find a query in cloud", async () => {
      await switchToSelfHosted(async () => {
        const query = await config.createQuery()
        const res = await request
          .get(`/api/queries/${query._id}`)
          .set(await config.defaultHeaders())
          .expect(200)
          .expect("Content-Type", /json/)
        expect(res.body.fields).toBeDefined()
        expect(res.body.parameters).toBeDefined()
        expect(res.body.schema).toBeDefined()
      })
    })

    it("should remove sensitive info for prod apps", async () => {
      // Mock isProdAppID to pretend we are using a prod app
      mockIsProdAppID.mockClear()
      mockIsProdAppID.mockImplementation(() => true)

      const query = await config.createQuery()
      const res = await request
        .get(`/api/queries/${query._id}`)
        .set(await config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body._id).toEqual(query._id)
      expect(res.body.fields).toBeUndefined()
      expect(res.body.parameters).toBeUndefined()
      expect(res.body.schema).toBeDefined()

      // Reset isProdAppID mock
      expect(mockIsProdAppID).toHaveBeenCalledTimes(1)
      mockIsProdAppID.mockImplementation(isProdAppID)
    })
  })

  describe("destroy", () => {
    it("deletes a query and returns a success message", async () => {
      await request
        .delete(`/api/queries/${query._id}/${query._rev}`)
        .set(config.defaultHeaders())
        .expect(200)

      const res = await request
        .get(`/api/queries`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)

      expect(res.body).toEqual([])
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "DELETE",
        url: `/api/queries/${config._id}/${config._rev}`,
      })
    })
  })

  describe("preview", () => {
    it("should be able to preview the query", async () => {
      const res = await request
        .post(`/api/queries/preview`)
        .send({
          datasourceId: datasource._id,
          parameters: {},
          fields: {},
          queryVerb: "read",
        })
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      // these responses come from the mock
      expect(res.body.schemaFields).toEqual(["a", "b"])
      expect(res.body.rows.length).toEqual(1)
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "POST",
        url: `/api/queries/preview`,
      })
    })

    it("should fail with invalid integration type", async () => {
      const { datasource } = await createInvalidIntegration()
      await request
        .post(`/api/queries/preview`)
        .send({
          datasourceId: datasource._id,
          parameters: {},
          fields: {},
          queryVerb: "read",
        })
        .set(config.defaultHeaders())
        .expect(400)
    })
  })

  describe("execute", () => {
    it("should be able to execute the query", async () => {
      const res = await request
        .post(`/api/queries/${query._id}`)
        .send({
          parameters: {},
        })
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body.length).toEqual(1)
    })

    it("should fail with invalid integration type", async () => {
      const { query, datasource } = await createInvalidIntegration()
      await request
        .post(`/api/queries/${query._id}`)
        .send({
          datasourceId: datasource._id,
          parameters: {},
          fields: {},
          queryVerb: "read",
        })
        .set(config.defaultHeaders())
        .expect(400)
    })
  })
})
