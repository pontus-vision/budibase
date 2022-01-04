import internal from "./internal"
import external from "./external"
import { isExternalTable } from "../../../integrations/utils"

function pickApi(tableId) {
  if (isExternalTable(tableId)) {
    return external
  }
  return internal
}

function getTableId(ctx) {
  if (ctx.request.body && ctx.request.body.tableId) {
    return ctx.request.body.tableId
  }
  if (ctx.params && ctx.params.tableId) {
    return ctx.params.tableId
  }
  if (ctx.params && ctx.params.viewName) {
    return ctx.params.viewName
  }
}

export async function patch(ctx) {
  const appId = ctx.appId
  const tableId = getTableId(ctx)
  const body = ctx.request.body
  // if it doesn't have an _id then its save
  if (body && !body._id) {
    return save(ctx)
  }
  try {
    const { row, table } = await pickApi(tableId).patch(ctx)
    ctx.status = 200
    ctx.eventEmitter &&
      ctx.eventEmitter.emitRow(`row:update`, appId, row, table)
    ctx.message = `${table.name} updated successfully.`
    ctx.body = row
  } catch (err) {
    ctx.throw(400, err)
  }
}

export async function save(ctx) {
  const appId = ctx.appId
  const tableId = getTableId(ctx)
  const body = ctx.request.body
  // if it has an ID already then its a patch
  if (body && body._id) {
    return patch(ctx)
  }
  try {
    const { row, table } = await pickApi(tableId).save(ctx)
    ctx.status = 200
    ctx.eventEmitter && ctx.eventEmitter.emitRow(`row:save`, appId, row, table)
    ctx.message = `${table.name} saved successfully`
    ctx.body = row
  } catch (err) {
    ctx.throw(400, err)
  }
}

export async function fetchView(ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).fetchView(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

export async function fetch(ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).fetch(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

export async function find(ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).find(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

export async function destroy(ctx) {
  const appId = ctx.appId
  const inputs = ctx.request.body
  const tableId = getTableId(ctx)
  let response, row
  if (inputs.rows) {
    let { rows } = await pickApi(tableId).bulkDestroy(ctx)
    response = rows
    for (let row of rows) {
      ctx.eventEmitter && ctx.eventEmitter.emitRow(`row:delete`, appId, row)
    }
  } else {
    let resp = await pickApi(tableId).destroy(ctx)
    response = resp.response
    row = resp.row
    ctx.eventEmitter && ctx.eventEmitter.emitRow(`row:delete`, appId, row)
  }
  ctx.status = 200
  // for automations include the row that was deleted
  ctx.row = row || {}
  ctx.body = response
}

export async function search(ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.status = 200
    ctx.body = await pickApi(tableId).search(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

export async function validate(ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).validate(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

export async function fetchEnrichedRow(ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).fetchEnrichedRow(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}
