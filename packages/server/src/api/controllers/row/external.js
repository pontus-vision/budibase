import {
  DataSourceOperation,
  SortDirection,
  FieldTypes,
  NoEmptyFilterStrings,
} from "../../../constants"
import {
  breakExternalTableId,
  breakRowIdField,
} from "../../../integrations/utils"
import ExternalRequest from "./ExternalRequest"
import CouchDB from "../../../db"

async function handleRequest(appId, operation, tableId, opts = {}) {
  // make sure the filters are cleaned up, no empty strings for equals, fuzzy or string
  if (opts && opts.filters) {
    for (let filterField of NoEmptyFilterStrings) {
      if (!opts.filters[filterField]) {
        continue
      }
      for (let [key, value] of Object.entries(opts.filters[filterField])) {
        if (!value || value === "") {
          delete opts.filters[filterField][key]
        }
      }
    }
  }
  return new ExternalRequest(appId, operation, tableId, opts.datasource).run(
    opts
  )
}

const _handleRequest = handleRequest
export { _handleRequest as handleRequest }

export async function patch(ctx) {
  const appId = ctx.appId
  const inputs = ctx.request.body
  const tableId = ctx.params.tableId
  const id = breakRowIdField(inputs._id)
  // don't save the ID to db
  delete inputs._id
  return handleRequest(appId, DataSourceOperation.UPDATE, tableId, {
    id,
    row: inputs,
  })
}

export async function save(ctx) {
  const appId = ctx.appId
  const inputs = ctx.request.body
  const tableId = ctx.params.tableId
  return handleRequest(appId, DataSourceOperation.CREATE, tableId, {
    row: inputs,
  })
}

export async function fetchView(ctx) {
  // there are no views in external data sources, shouldn't ever be called
  // for now just fetch
  const split = ctx.params.viewName.split("all_")
  ctx.params.tableId = split[1] ? split[1] : split[0]
  return fetch(ctx)
}

export async function fetch(ctx) {
  const appId = ctx.appId
  const tableId = ctx.params.tableId
  return handleRequest(appId, DataSourceOperation.READ, tableId)
}

export async function find(ctx) {
  const appId = ctx.appId
  const id = ctx.params.rowId
  const tableId = ctx.params.tableId
  const response = await handleRequest(
    appId,
    DataSourceOperation.READ,
    tableId,
    {
      id,
    }
  )
  return response ? response[0] : response
}

export async function destroy(ctx) {
  const appId = ctx.appId
  const tableId = ctx.params.tableId
  const id = ctx.request.body._id
  const { row } = await handleRequest(
    appId,
    DataSourceOperation.DELETE,
    tableId,
    {
      id,
    }
  )
  return { response: { ok: true }, row }
}

export async function bulkDestroy(ctx) {
  const appId = ctx.appId
  const { rows } = ctx.request.body
  const tableId = ctx.params.tableId
  let promises = []
  for (let row of rows) {
    promises.push(
      handleRequest(appId, DataSourceOperation.DELETE, tableId, {
        id: breakRowIdField(row._id),
      })
    )
  }
  const responses = await Promise.all(promises)
  return { response: { ok: true }, rows: responses.map(resp => resp.row) }
}

export async function search(ctx) {
  const appId = ctx.appId
  const tableId = ctx.params.tableId
  const { paginate, query, ...params } = ctx.request.body
  let { bookmark, limit } = params
  if (!bookmark && paginate) {
    bookmark = 1
  }
  let paginateObj = {}

  if (paginate) {
    paginateObj = {
      // add one so we can track if there is another page
      limit: limit,
      page: bookmark,
    }
  } else if (params && limit) {
    paginateObj = {
      limit: limit,
    }
  }
  let sort
  if (params.sort) {
    const direction =
      params.sortOrder === "descending"
        ? SortDirection.DESCENDING
        : SortDirection.ASCENDING
    sort = {
      [params.sort]: direction,
    }
  }
  const rows = await handleRequest(appId, DataSourceOperation.READ, tableId, {
    filters: query,
    sort,
    paginate: paginateObj,
  })
  let hasNextPage = false
  if (paginate && rows.length === limit) {
    const nextRows = await handleRequest(
      appId,
      DataSourceOperation.READ,
      tableId,
      {
        filters: query,
        sort,
        paginate: {
          limit: 1,
          page: bookmark * limit + 1,
        },
      }
    )
    hasNextPage = nextRows.length > 0
  }
  // need wrapper object for bookmarks etc when paginating
  return { rows, hasNextPage, bookmark: bookmark + 1 }
}

export async function validate() {
  // can't validate external right now - maybe in future
  return { valid: true }
}

export async function fetchEnrichedRow(ctx) {
  const appId = ctx.appId
  const id = ctx.params.rowId
  const tableId = ctx.params.tableId
  const { datasourceId, tableName } = breakExternalTableId(tableId)
  const db = new CouchDB(appId)
  const datasource = await db.get(datasourceId)
  if (!datasource || !datasource.entities) {
    ctx.throw(400, "Datasource has not been configured for plus API.")
  }
  const tables = datasource.entities
  const response = await handleRequest(
    appId,
    DataSourceOperation.READ,
    tableId,
    {
      id,
      datasource,
    }
  )
  const table = tables[tableName]
  const row = response[0]
  // this seems like a lot of work, but basically we need to dig deeper for the enrich
  // for a single row, there is probably a better way to do this with some smart multi-layer joins
  for (let [fieldName, field] of Object.entries(table.schema)) {
    if (
      field.type !== FieldTypes.LINK ||
      !row[fieldName] ||
      row[fieldName].length === 0
    ) {
      continue
    }
    const links = row[fieldName]
    const linkedTableId = field.tableId
    const linkedTable = tables[breakExternalTableId(linkedTableId).tableName]
    // don't support composite keys right now
    const linkedIds = links.map(link => breakRowIdField(link._id)[0])
    row[fieldName] = await handleRequest(
      appId,
      DataSourceOperation.READ,
      linkedTableId,
      {
        tables,
        filters: {
          oneOf: {
            [linkedTable.primary]: linkedIds,
          },
        },
      }
    )
  }
  return row
}
