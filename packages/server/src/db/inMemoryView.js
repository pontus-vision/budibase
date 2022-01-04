import PouchDB from "pouchdb"
import memory from "pouchdb-adapter-memory"
import newid from "./newid"

PouchDB.plugin(memory)
const Pouch = PouchDB.defaults({
  prefix: undefined,
  adapter: "memory",
})

export const runView = async (view, calculation, group, data) => {
  // use a different ID each time for the DB, make sure they
  // are always unique for each query, don't want overlap
  // which could cause 409s
  const db = new Pouch(newid())
  // write all the docs to the in memory Pouch (remove revs)
  await db.bulkDocs(
    data.map(row => ({
      ...row,
      _rev: undefined,
    }))
  )
  let fn = (doc, emit) => emit(doc._id)
  eval("fn = " + view.map.replace("function (doc)", "function (doc, emit)"))
  const queryFns = {
    meta: view.meta,
    map: fn,
  }
  if (view.reduce) {
    queryFns.reduce = view.reduce
  }
  const response = await db.query(queryFns, {
    include_docs: !calculation,
    group: !!group,
  })
  // need to fix the revs to be totally accurate
  for (let row of response.rows) {
    if (!row._rev || !row._id) {
      continue
    }
    const found = data.find(possible => possible._id === row._id)
    if (found) {
      row._rev = found._rev
    }
  }
  await db.destroy()
  return response
}
