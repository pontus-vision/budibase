import { IntegrationTypes } from "constants/backend"

export function schemaToFields(schema) {
  const response = {}
  if (schema && typeof schema === "object") {
    for (let [field, value] of Object.entries(schema)) {
      response[field] = value?.type || "string"
    }
  }
  return response
}

export function fieldsToSchema(fields) {
  const response = {}
  if (fields && typeof fields === "object") {
    for (let [name, type] of Object.entries(fields)) {
      response[name] = { name, type }
    }
  }
  return response
}

export function breakQueryString(qs) {
  if (!qs) {
    return {}
  }
  if (qs.includes("?")) {
    qs = qs.split("?")[1]
  }
  const params = qs.split("&")
  let paramObj = {}
  for (let param of params) {
    const [key, value] = param.split("=")
    paramObj[key] = value
  }
  return paramObj
}

export function buildQueryString(obj) {
  let str = ""
  if (obj) {
    for (let [key, value] of Object.entries(obj)) {
      if (!key || key === "") {
        continue
      }
      if (str !== "") {
        str += "&"
      }
      str += `${key}=${value || ""}`
    }
  }
  return str
}

export function keyValueToQueryParameters(obj) {
  let array = []
  if (obj && typeof obj === "object") {
    for (let [key, value] of Object.entries(obj)) {
      array.push({ name: key, default: value })
    }
  }
  return array
}

export function queryParametersToKeyValue(array) {
  let obj = {}
  if (Array.isArray(array)) {
    for (let param of array) {
      obj[param.name] = param.default
    }
  }
  return obj
}

export function customQueryIconText(datasource, query) {
  if (datasource.source !== IntegrationTypes.REST) {
    return
  }
  switch (query.queryVerb) {
    case "create":
      return "POST"
    case "update":
      return "PUT"
    case "read":
      return "GET"
    case "delete":
      return "DELETE"
    case "patch":
      return "PATCH"
  }
}

export function customQueryIconColor(datasource, query) {
  if (datasource.source !== IntegrationTypes.REST) {
    return
  }
  switch (query.queryVerb) {
    case "create":
      return "#dcc339"
    case "update":
      return "#5197ec"
    case "read":
      return "#53a761"
    case "delete":
      return "#ea7d82"
    case "patch":
    default:
      return
  }
}

export function flipHeaderState(headersActivity) {
  if (!headersActivity) {
    return {}
  }
  const enabled = {}
  Object.entries(headersActivity).forEach(([key, value]) => {
    enabled[key] = !value
  })
  return enabled
}
