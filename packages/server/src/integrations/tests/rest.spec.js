jest.mock("node-fetch", () =>
  jest.fn(() => ({
    headers: {
      raw: () => {
        return { "content-type": ["application/json"] }
      },
      get: () => ["application/json"]
    },
    json: jest.fn(), 
    text: jest.fn()
  }))
)
import fetch from "node-fetch"
import { integration } from "../rest"
import { AuthType } from "../rest"

const HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json"
}

class TestConfiguration {
  constructor(config = {}) {
    this.integration = new integration(config)
  }
}

describe("REST Integration", () => {
  const BASE_URL = "https://myapi.com"
  let config

  beforeEach(() => {
    config = new TestConfiguration({
      url: BASE_URL,
    })
    jest.clearAllMocks()
  })

  it("calls the create method with the correct params", async () => {
    const query = {
      path: "api",
      queryString: "test=1",
      headers: HEADERS,
      bodyType: "json",
      requestBody: JSON.stringify({
        name: "test",
      }),
    }
    const response = await config.integration.create(query)
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api?test=1`, {
      method: "POST",
      body: '{"name":"test"}',
      headers: HEADERS,
    })
  })

  it("calls the read method with the correct params", async () => {
    const query = {
      path: "api",
      queryString: "test=1",
      headers: {
        Accept: "text/html",
      },
    }
    const response = await config.integration.read(query)
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api?test=1`, {
      headers: {
        Accept: "text/html",
      },
      method: "GET",
    })
  })

  it("calls the update method with the correct params", async () => {
    const query = {
      path: "api",
      queryString: "test=1",
      headers: {
        Accept: "application/json",
      },
      bodyType: "json",
      requestBody: JSON.stringify({
        name: "test",
      }),
    }
    const response = await config.integration.update(query)
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api?test=1`, {
      method: "PUT",
      body: '{"name":"test"}',
      headers: HEADERS,
    })
  })

  it("calls the delete method with the correct params", async () => {
    const query = {
      path: "api",
      queryString: "test=1",
      headers: {
        Accept: "application/json",
      },
      bodyType: "json",
      requestBody: JSON.stringify({
        name: "test",
      }),
    }
    const response = await config.integration.delete(query)
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api?test=1`, {
      method: "DELETE",
      headers: HEADERS,
      body: '{"name":"test"}',
    })
  })

  describe("request body", () => {
    const input = { a: 1, b: 2 }

    it("should allow no body", () => {
      const output = config.integration.addBody("none", null, {})
      expect(output.body).toBeUndefined()
      expect(Object.keys(output.headers).length).toEqual(0)
    })

    it("should allow text body", () => {
      const output = config.integration.addBody("text", "hello world", {})
      expect(output.body).toEqual("hello world")
      // gets added by fetch
      expect(Object.keys(output.headers).length).toEqual(0)
    })

    it("should allow form data", () => {
      const FormData = require("form-data")
      const output = config.integration.addBody("form", input, {})
      expect(output.body instanceof FormData).toEqual(true)
      expect(output.body._valueLength).toEqual(2)
      // gets added by fetch
      expect(Object.keys(output.headers).length).toEqual(0)
    })

    it("should allow encoded form data", () => {
      const { URLSearchParams } = require("url")
      const output = config.integration.addBody("encoded", input, {})
      expect(output.body instanceof URLSearchParams).toEqual(true)
      expect(output.body.toString()).toEqual("a=1&b=2")
      // gets added by fetch
      expect(Object.keys(output.headers).length).toEqual(0)
    })

    it("should allow JSON", () => {
      const output = config.integration.addBody("json", input, {})
      expect(output.body).toEqual(JSON.stringify(input))
      expect(output.headers["Content-Type"]).toEqual("application/json")
    })

    it("should allow XML", () => {
      const output = config.integration.addBody("xml", input, {})
      expect(output.body.includes("<a>1</a>")).toEqual(true)
      expect(output.body.includes("<b>2</b>")).toEqual(true)
      expect(output.headers["Content-Type"]).toEqual("application/xml")
    })
  })

  describe("response", () => {
    function buildInput(json, text, header) {
      return {
        status: 200,
        json: json ? async () => json : undefined,
        text: text ? async () => text : undefined,
        headers: { get: key => key === "content-length" ? 100 : header, raw: () => ({ "content-type": header }) }
      }
    }

    it("should be able to parse JSON response", async () => {
      const input = buildInput({a: 1}, null, "application/json")
      const output = await config.integration.parseResponse(input)
      expect(output.data).toEqual({a: 1})
      expect(output.info.code).toEqual(200)
      expect(output.info.size).toEqual("100B")
      expect(output.extra.raw).toEqual(JSON.stringify({a: 1}))
      expect(output.extra.headers["content-type"]).toEqual("application/json")
    })

    it("should be able to parse text response", async () => {
      const text = "hello world"
      const input = buildInput(null, text, "text/plain")
      const output = await config.integration.parseResponse(input)
      expect(output.data).toEqual(text)
      expect(output.extra.raw).toEqual(text)
      expect(output.extra.headers["content-type"]).toEqual("text/plain")
    })

    it("should be able to parse XML response", async () => {
      const text = "<root><a>1</a><b>2</b></root>"
      const input = buildInput(null, text, "application/xml")
      const output = await config.integration.parseResponse(input)
      expect(output.data).toEqual({a: "1", b: "2"})
      expect(output.extra.raw).toEqual(text)
      expect(output.extra.headers["content-type"]).toEqual("application/xml")
    })
  })

  describe("authentication", () => {
    const basicAuth = {
      _id: "c59c14bd1898a43baa08da68959b24686",
      name: "basic-1",
      type : AuthType.BASIC,
      config : {
        username: "user",
        password: "password"
      }
    }
    
    const bearerAuth = {
      _id: "0d91d732f34e4befabeff50b392a8ff3",
      name: "bearer-1",
      type : AuthType.BEARER,
      config : {
        "token": "mytoken"
      }
    }

    beforeEach(() => {
      config = new TestConfiguration({
        url: BASE_URL,
        authConfigs : [basicAuth, bearerAuth]
      })
    })

    it("adds basic auth", async () => {
      const query = {
        authConfigId: "c59c14bd1898a43baa08da68959b24686"
      }
      await config.integration.read(query)
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/?`, {
        method: "GET",
        headers: {
          Authorization: "Basic dXNlcjpwYXNzd29yZA=="
        },
      })
    })

    it("adds bearer auth", async () => {
      const query = {
        authConfigId: "0d91d732f34e4befabeff50b392a8ff3"
      }
      await config.integration.read(query)
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/?`, {
        method: "GET",
        headers: {
          Authorization: "Bearer mytoken"
        },
      })
    })
  })
})
