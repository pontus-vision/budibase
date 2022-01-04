import rowController from "../../api/controllers/row"
import tableController from "../../api/controllers/table"
import { FieldTypes } from "../../constants"
import { buildCtx } from "./utils"
import automationUtils from "../automationUtils"

const SortOrders = {
  ASCENDING: "ascending",
  DESCENDING: "descending",
}

const SortOrdersPretty = {
  [SortOrders.ASCENDING]: "Ascending",
  [SortOrders.DESCENDING]: "Descending",
}

export const definition = {
  description: "Query rows from the database",
  icon: "Search",
  name: "Query rows",
  tagline: "Query rows from {{inputs.enriched.table.name}} table",
  type: "ACTION",
  stepId: "QUERY_ROWS",
  internal: true,
  inputs: {},
  schema: {
    inputs: {
      properties: {
        tableId: {
          type: "string",
          customType: "table",
          title: "Table",
        },
        filters: {
          type: "object",
          customType: "filters",
          title: "Filtering",
        },
        sortColumn: {
          type: "string",
          title: "Sort Column",
          customType: "column",
        },
        sortOrder: {
          type: "string",
          title: "Sort Order",
          enum: Object.values(SortOrders),
          pretty: Object.values(SortOrdersPretty),
        },
        limit: {
          type: "number",
          title: "Limit",
        },
      },
      required: ["tableId"],
    },
    outputs: {
      properties: {
        rows: {
          type: "array",
          customType: "rows",
          description: "The rows that were found",
        },
        success: {
          type: "boolean",
          description: "Whether the deletion was successful",
        },
      },
      required: ["rows", "success"],
    },
  },
}

async function getTable(appId, tableId) {
  const ctx = buildCtx(appId, null, {
    params: {
      id: tableId,
    },
  })
  await tableController.find(ctx)
  return ctx.body
}

export const run = async function ({ inputs, appId }) {
  const { tableId, filters, sortColumn, sortOrder, limit } = inputs
  const table = await getTable(appId, tableId)
  let sortType = FieldTypes.STRING
  if (table && table.schema && sortColumn) {
    const fieldType = table.schema[sortColumn].type
    sortType =
      fieldType === FieldTypes.NUMBER ? FieldTypes.NUMBER : FieldTypes.STRING
  }
  const ctx = buildCtx(appId, null, {
    params: {
      tableId,
    },
    body: {
      sortOrder,
      sortType,
      sort: sortColumn,
      query: filters || {},
      limit,
    },
  })
  try {
    await rowController.search(ctx)
    return {
      rows: ctx.body ? ctx.body.rows : [],
      success: ctx.status === 200,
    }
  } catch (err) {
    return {
      success: false,
      response: automationUtils.getError(err),
    }
  }
}
