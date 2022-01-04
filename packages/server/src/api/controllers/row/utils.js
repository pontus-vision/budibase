import { extend, validators, single } from "validate.js"
import { cloneDeep } from "lodash/fp"
import CouchDB from "../../../db"
import { InternalTables } from "../../../db/utils"
import { findMetadata } from "../user"
import { FieldTypes } from "../../../constants"
import { processStringSync } from "@budibase/string-templates"
import { makeExternalQuery } from "../../../integrations/base/utils"

extend(validators.datetime, {
  parse: function (value) {
    return new Date(value).getTime()
  },
  // Input is a unix timestamp
  format: function (value) {
    return new Date(value).toISOString()
  },
})

export async function getDatasourceAndQuery(appId, json) {
  const datasourceId = json.endpoint.datasourceId
  const db = new CouchDB(appId)
  const datasource = await db.get(datasourceId)
  return makeExternalQuery(datasource, json)
}

export async function findRow(ctx, db, tableId, rowId) {
  let row
  // TODO remove special user case in future
  if (tableId === InternalTables.USER_METADATA) {
    ctx.params = {
      id: rowId,
    }
    await findMetadata(ctx)
    row = ctx.body
  } else {
    row = await db.get(rowId)
  }
  if (row.tableId !== tableId) {
    throw "Supplied tableId does not match the rows tableId"
  }
  return row
}

export async function validate({ appId, tableId, row, table }) {
  if (!table) {
    const db = new CouchDB(appId)
    table = await db.get(tableId)
  }
  const errors = {}
  for (let fieldName of Object.keys(table.schema)) {
    const constraints = cloneDeep(table.schema[fieldName].constraints)
    // special case for options, need to always allow unselected (null)
    if (
      table.schema[fieldName].type ===
        (FieldTypes.OPTIONS || FieldTypes.ARRAY) &&
      constraints.inclusion
    ) {
      constraints.inclusion.push(null)
    }
    let res

    // Validate.js doesn't seem to handle array
    if (
      table.schema[fieldName].type === FieldTypes.ARRAY &&
      row[fieldName] &&
      row[fieldName].length
    ) {
      row[fieldName].map(val => {
        if (!constraints.inclusion.includes(val)) {
          errors[fieldName] = "Field not in list"
        }
      })
    } else if (table.schema[fieldName].type === FieldTypes.FORMULA) {
      res = single(
        processStringSync(table.schema[fieldName].formula, row),
        constraints
      )
    } else {
      res = single(row[fieldName], constraints)
    }
    if (res) errors[fieldName] = res
  }
  return { valid: Object.keys(errors).length === 0, errors }
}
