import CouchDB from "../../../db"
import viewTemplate from "./viewBuilder"
import { apiFileReturn } from "../../../utilities/fileSystem"
import exporters, { ExportFormats } from "./exporters"
import { saveView, getView, getViews, deleteView } from "./utils"
import { fetchView } from "../row"
import { getTable } from "../table/utils"
import { FieldTypes } from "../../../constants"

export async function fetch(ctx) {
  const db = new CouchDB(ctx.appId)
  ctx.body = await getViews(db)
}

export async function save(ctx) {
  const db = new CouchDB(ctx.appId)
  const { originalName, ...viewToSave } = ctx.request.body
  const view = viewTemplate(viewToSave)

  if (!viewToSave.name) {
    ctx.throw(400, "Cannot create view without a name")
  }

  await saveView(db, originalName, viewToSave.name, view)

  // add views to table document
  const table = await db.get(ctx.request.body.tableId)
  if (!table.views) table.views = {}
  if (!view.meta.schema) {
    view.meta.schema = table.schema
  }
  table.views[viewToSave.name] = view.meta
  if (originalName) {
    delete table.views[originalName]
  }
  await db.put(table)

  ctx.body = {
    ...table.views[viewToSave.name],
    name: viewToSave.name,
  }
}

export async function destroy(ctx) {
  const db = new CouchDB(ctx.appId)
  const viewName = decodeURI(ctx.params.viewName)
  const view = await deleteView(db, viewName)
  const table = await db.get(view.meta.tableId)
  delete table.views[viewName]
  await db.put(table)

  ctx.body = view
}

export async function exportView(ctx) {
  const db = new CouchDB(ctx.appId)
  const viewName = decodeURI(ctx.query.view)
  const view = await getView(db, viewName)

  const format = ctx.query.format
  if (!format || !Object.values(ExportFormats).includes(format)) {
    ctx.throw(400, "Format must be specified, either csv or json")
  }

  if (view) {
    ctx.params.viewName = viewName
    // Fetch view rows
    ctx.query = {
      group: view.meta.groupBy,
      calculation: view.meta.calculation,
      stats: !!view.meta.field,
      field: view.meta.field,
    }
  } else {
    // table all_ view
    /* istanbul ignore next */
    ctx.params.viewName = viewName
  }

  await fetchView(ctx)
  let rows = ctx.body

  let schema = view && view.meta && view.meta.schema
  if (!schema) {
    const tableId = ctx.params.tableId || view.meta.tableId
    const table = await getTable(ctx.appId, tableId)
    schema = table.schema
  }

  // remove any relationships
  const relationships = Object.entries(schema)
    .filter(entry => entry[1].type === FieldTypes.LINK)
    .map(entry => entry[0])
  // iterate relationship columns and remove from and row and schema
  relationships.forEach(column => {
    rows.forEach(row => {
      delete row[column]
    })
    delete schema[column]
  })

  // make sure no "undefined" entries appear in the CSV
  if (format === ExportFormats.CSV) {
    const schemaKeys = Object.keys(schema)
    for (let key of schemaKeys) {
      for (let row of rows) {
        if (row[key] == null) {
          row[key] = ""
        }
      }
    }
  }

  // Export part
  let headers = Object.keys(schema)
  const exporter = exporters[format]
  const filename = `${viewName}.${format}`
  // send down the file
  ctx.attachment(filename)
  ctx.body = apiFileReturn(exporter(headers, rows))
}
