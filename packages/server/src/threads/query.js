const threadUtils = require("./utils")
threadUtils.threadSetup()
const ScriptRunner = require("../utilities/scriptRunner")
const { integrations } = require("../integrations")
const { processStringSync } = require("@budibase/string-templates")
const CouchDB = require("../db")

const IS_TRIPLE_BRACE = new RegExp(/^{{3}.*}{3}$/)
const IS_HANDLEBARS = new RegExp(/^{{2}.*}{2}$/)

class QueryRunner {
  constructor(input, flags = { noRecursiveQuery: false }) {
    this.appId = input.appId
    this.datasource = input.datasource
    this.queryVerb = input.queryVerb
    this.fields = input.fields
    this.parameters = input.parameters
    this.pagination = input.pagination
    this.transformer = input.transformer
    this.queryId = input.queryId
    this.noRecursiveQuery = flags.noRecursiveQuery
    this.cachedVariables = []
    // allows the response from a query to be stored throughout this
    // execution so that if it needs to be re-used for another variable
    // it can be
    this.queryResponse = {}
    this.hasRerun = false
  }

  async execute() {
    let { datasource, fields, queryVerb, transformer } = this
    // pre-query, make sure datasource variables are added to parameters
    const parameters = await this.addDatasourceVariables()
    let query = this.enrichQueryFields(fields, parameters)

    // Add pagination values for REST queries
    if (this.pagination) {
      query.paginationValues = this.pagination
    }

    const Integration = integrations[datasource.source]
    if (!Integration) {
      throw "Integration type does not exist."
    }
    const integration = new Integration(datasource.config)

    let output = threadUtils.formatResponse(await integration[queryVerb](query))
    let rows = output,
      info = undefined,
      extra = undefined,
      pagination = undefined
    if (threadUtils.hasExtraData(output)) {
      rows = output.data
      info = output.info
      extra = output.extra
      pagination = output.pagination
    }

    // transform as required
    if (transformer) {
      const runner = new ScriptRunner(transformer, {
        data: rows,
        params: parameters,
      })
      rows = runner.execute()
    }

    // if the request fails we retry once, invalidating the cached value
    if (
      info &&
      info.code >= 400 &&
      this.cachedVariables.length > 0 &&
      !this.hasRerun
    ) {
      this.hasRerun = true
      // invalidate the cache value
      await threadUtils.invalidateDynamicVariables(this.cachedVariables)
      return this.execute()
    }

    // needs to an array for next step
    if (!Array.isArray(rows)) {
      rows = [rows]
    }

    // map into JSON if just raw primitive here
    if (rows.find(row => typeof row !== "object")) {
      rows = rows.map(value => ({ value }))
    }

    // get all the potential fields in the schema
    let keys = rows.flatMap(Object.keys)

    if (integration.end) {
      integration.end()
    }

    return { rows, keys, info, extra, pagination }
  }

  async runAnotherQuery(queryId, parameters) {
    const db = new CouchDB(this.appId)
    const query = await db.get(queryId)
    const datasource = await db.get(query.datasourceId)
    return new QueryRunner(
      {
        appId: this.appId,
        datasource,
        queryVerb: query.queryVerb,
        fields: query.fields,
        parameters,
        transformer: query.transformer,
      },
      { noRecursiveQuery: true }
    ).execute()
  }

  async getDynamicVariable(variable) {
    let { parameters } = this
    const queryId = variable.queryId,
      name = variable.name
    let value = await threadUtils.checkCacheForDynamicVariable(queryId, name)
    if (!value) {
      value = this.queryResponse[queryId]
        ? this.queryResponse[queryId]
        : await this.runAnotherQuery(queryId, parameters)
      // store incase this query is to be called again
      this.queryResponse[queryId] = value
      await threadUtils.storeDynamicVariable(queryId, name, value)
    } else {
      this.cachedVariables.push({ queryId, name })
    }
    return value
  }

  async addDatasourceVariables() {
    let { datasource, parameters, fields } = this
    if (!datasource || !datasource.config) {
      return parameters
    }
    const staticVars = datasource.config.staticVariables || {}
    const dynamicVars = datasource.config.dynamicVariables || []
    for (let [key, value] of Object.entries(staticVars)) {
      if (!parameters[key]) {
        parameters[key] = value
      }
    }
    if (!this.noRecursiveQuery) {
      // need to see if this uses any variables
      const stringFields = JSON.stringify(fields)
      const foundVars = dynamicVars.filter(variable => {
        // don't allow a query to use its own dynamic variable (loop)
        if (variable.queryId === this.queryId) {
          return false
        }
        // look for {{ variable }} but allow spaces between handlebars
        const regex = new RegExp(`{{[ ]*${variable.name}[ ]*}}`)
        return regex.test(stringFields)
      })
      const dynamics = foundVars.map(dynVar => this.getDynamicVariable(dynVar))
      const responses = await Promise.all(dynamics)
      for (let i = 0; i < foundVars.length; i++) {
        const variable = foundVars[i]
        parameters[variable.name] = processStringSync(variable.value, {
          data: responses[i].rows,
          info: responses[i].extra,
        })
        // make sure its known that this uses dynamic variables in case it fails
        this.hasDynamicVariables = true
      }
    }
    return parameters
  }

  enrichQueryFields(fields, parameters = {}) {
    const enrichedQuery = {}

    // enrich the fields with dynamic parameters
    for (let key of Object.keys(fields)) {
      if (fields[key] == null) {
        continue
      }
      if (typeof fields[key] === "object") {
        // enrich nested fields object
        enrichedQuery[key] = this.enrichQueryFields(fields[key], parameters)
      } else if (typeof fields[key] === "string") {
        // enrich string value as normal
        let value = fields[key]
        // add triple brace to avoid escaping e.g. '=' in cookie header
        if (IS_HANDLEBARS.test(value) && !IS_TRIPLE_BRACE.test(value)) {
          value = `{${value}}`
        }
        enrichedQuery[key] = processStringSync(value, parameters, {
          noHelpers: true,
        })
      } else {
        enrichedQuery[key] = fields[key]
      }
    }
    if (
      enrichedQuery.json ||
      enrichedQuery.customData ||
      enrichedQuery.requestBody
    ) {
      try {
        enrichedQuery.json = JSON.parse(
          enrichedQuery.json ||
            enrichedQuery.customData ||
            enrichedQuery.requestBody
        )
      } catch (err) {
        // no json found, ignore
      }
      delete enrichedQuery.customData
    }
    return enrichedQuery
  }
}

module.exports = (input, callback) => {
  const Runner = new QueryRunner(input)
  Runner.execute()
    .then(response => {
      callback(null, response)
    })
    .catch(err => {
      callback(err)
    })
}
