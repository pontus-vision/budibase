import rowController from "../../../controllers/row"
import appController from "../../../controllers/application"
import CouchDB from "../../../../db"
import { AppStatus } from "../../../../db/utils"
import { BUILTIN_ROLE_IDS } from "@budibase/auth/roles"
import { TENANT_ID } from "../../../../tests/utilities/structures"

function Request(appId, params) {
  this.appId = appId
  this.params = params
  this.request = {}
}

export const getAllTableRows = async config => {
  const req = new Request(config.appId, { tableId: config.table._id })
  await rowController.fetch(req)
  return req.body
}

export const clearAllApps = async (tenantId = TENANT_ID) => {
  const req = { query: { status: AppStatus.DEV }, user: { tenantId } }
  await appController.fetch(req)
  const apps = req.body
  if (!apps || apps.length <= 0) {
    return
  }
  for (let app of apps) {
    const { appId } = app
    await appController.delete(new Request(null, { appId }))
  }
}

export const clearAllAutomations = async config => {
  const automations = await config.getAllAutomations()
  for (let auto of automations) {
    await config.deleteAutomation(auto)
  }
}

export const createRequest = (request, method, url, body) => {
  let req

  if (method === "POST") req = request.post(url).send(body)
  else if (method === "GET") req = request.get(url)
  else if (method === "DELETE") req = request.delete(url)
  else if (method === "PATCH") req = request.patch(url).send(body)
  else if (method === "PUT") req = request.put(url).send(body)

  return req
}

export const checkBuilderEndpoint = async ({ config, method, url, body }) => {
  const headers = await config.login({
    userId: "us_fail",
    builder: false,
    prodApp: true,
  })
  await createRequest(config.request, method, url, body)
    .set(headers)
    .expect(403)
}

export const checkPermissionsEndpoint = async ({
  config,
  method,
  url,
  body,
  passRole,
  failRole,
}) => {
  const passHeader = await config.login({
    roleId: passRole,
    prodApp: true,
  })

  await createRequest(config.request, method, url, body)
    .set(passHeader)
    .expect(200)

  let failHeader
  if (failRole === BUILTIN_ROLE_IDS.PUBLIC) {
    failHeader = config.publicHeaders({ prodApp: true })
  } else {
    failHeader = await config.login({
      roleId: failRole,
      builder: false,
      prodApp: true,
    })
  }

  await createRequest(config.request, method, url, body)
    .set(failHeader)
    .expect(403)
}

export const getDB = config => {
  return new CouchDB(config.getAppId())
}

export const testAutomation = async (config, automation) => {
  return await config.request
    .post(`/api/automations/${automation._id}/test`)
    .send({
      row: {
        name: "Test",
        description: "TEST",
      },
    })
    .set(config.defaultHeaders())
    .expect("Content-Type", /json/)
    .expect(200)
}
