import queryController from "../../api/controllers/query"
import { buildCtx } from "./utils"
import automationUtils from "../automationUtils"

export const definition = {
  name: "External Data Connector",
  tagline: "Execute Data Connector",
  icon: "Data",
  description: "Execute a query in an external data connector",
  type: "ACTION",
  stepId: "EXECUTE_QUERY",
  internal: true,
  inputs: {},
  schema: {
    inputs: {
      properties: {
        query: {
          type: "object",
          properties: {
            queryId: {
              type: "string",
              customType: "query",
            },
          },
          customType: "queryParams",
          title: "Parameters",
          required: ["queryId"],
        },
      },
      required: ["query"],
    },
    outputs: {
      properties: {
        response: {
          type: "object",
          description: "The response from the datasource execution",
        },
        success: {
          type: "boolean",
          description: "Whether the action was successful",
        },
      },
    },
    required: ["response", "success"],
  },
}

export const run = async function ({ inputs, appId, emitter }) {
  if (inputs.query == null) {
    return {
      success: false,
      response: {
        message: "Invalid inputs",
      },
    }
  }

  const { queryId, ...rest } = inputs.query

  const ctx = buildCtx(appId, emitter, {
    body: {
      parameters: rest,
    },
    params: {
      queryId,
    },
  })

  try {
    await queryController.execute(ctx)
    return {
      response: ctx.body,
      success: true,
    }
  } catch (err) {
    return {
      success: false,
      response: automationUtils.getError(err),
    }
  }
}
