import { FieldTypes } from "../../constants"
import { processStringSync } from "@budibase/string-templates"

/**
 * Looks through the rows provided and finds formulas - which it then processes.
 */
export const processFormulas = (table, rows) => {
  const single = !Array.isArray(rows)
  if (single) {
    rows = [rows]
  }
  for (let [column, schema] of Object.entries(table.schema)) {
    if (schema.type !== FieldTypes.FORMULA) {
      continue
    }
    // iterate through rows and process formula
    rows = rows.map(row => ({
      ...row,
      [column]: processStringSync(schema.formula, row),
    }))
  }
  return single ? rows[0] : rows
}
