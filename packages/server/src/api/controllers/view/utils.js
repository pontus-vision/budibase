import {
  ViewNames,
  generateMemoryViewID,
  getMemoryViewParams,
  DocumentTypes,
  SEPARATOR,
} from "../../../db/utils"
import { SELF_HOSTED } from "../../../environment"

export async function getView(db, viewName) {
  if (SELF_HOSTED) {
    const designDoc = await db.get("_design/database")
    return designDoc.views[viewName]
  } else {
    // This is a table view, don't read the view from the DB
    if (viewName.startsWith(DocumentTypes.TABLE + SEPARATOR)) {
      return null
    }

    const viewDoc = await db.get(generateMemoryViewID(viewName))
    return viewDoc.view
  }
}

export async function getViews(db) {
  const response = []
  if (SELF_HOSTED) {
    const designDoc = await db.get("_design/database")
    for (let name of Object.keys(designDoc.views)) {
      // Only return custom views, not built ins
      if (Object.values(ViewNames).indexOf(name) !== -1) {
        continue
      }
      response.push({
        name,
        ...designDoc.views[name],
      })
    }
  } else {
    const views = (
      await db.allDocs(
        getMemoryViewParams({
          include_docs: true,
        })
      )
    ).rows.map(row => row.doc)
    for (let viewDoc of views) {
      response.push({
        name: viewDoc.name,
        ...viewDoc.view,
      })
    }
  }
  return response
}

export async function saveView(db, originalName, viewName, viewTemplate) {
  if (SELF_HOSTED) {
    const designDoc = await db.get("_design/database")
    designDoc.views = {
      ...designDoc.views,
      [viewName]: viewTemplate,
    }
    // view has been renamed
    if (originalName) {
      delete designDoc.views[originalName]
    }
    await db.put(designDoc)
  } else {
    const id = generateMemoryViewID(viewName)
    const originalId = originalName ? generateMemoryViewID(originalName) : null
    const viewDoc = {
      _id: id,
      view: viewTemplate,
      name: viewName,
      tableId: viewTemplate.meta.tableId,
    }
    try {
      const old = await db.get(id)
      if (originalId) {
        const originalDoc = await db.get(originalId)
        await db.remove(originalDoc._id, originalDoc._rev)
      }
      if (old && old._rev) {
        viewDoc._rev = old._rev
      }
    } catch (err) {
      // didn't exist, just skip
    }
    await db.put(viewDoc)
  }
}

export async function deleteView(db, viewName) {
  if (SELF_HOSTED) {
    const designDoc = await db.get("_design/database")
    const view = designDoc.views[viewName]
    delete designDoc.views[viewName]
    await db.put(designDoc)
    return view
  } else {
    const id = generateMemoryViewID(viewName)
    const viewDoc = await db.get(id)
    await db.remove(viewDoc._id, viewDoc._rev)
    return viewDoc.view
  }
}

export async function migrateToInMemoryView(db, viewName) {
  // delete the view initially
  const designDoc = await db.get("_design/database")
  const view = designDoc.views[viewName]
  delete designDoc.views[viewName]
  await db.put(designDoc)
  await saveView(db, null, viewName, view)
}

export async function migrateToDesignView(db, viewName) {
  let view = await db.get(generateMemoryViewID(viewName))
  const designDoc = await db.get("_design/database")
  designDoc.views[viewName] = view.view
  await db.put(designDoc)
  await db.remove(view._id, view._rev)
}

export async function getFromDesignDoc(db, viewName) {
  const designDoc = await db.get("_design/database")
  let view = designDoc.views[viewName]
  if (view == null) {
    throw { status: 404, message: "Unable to get view" }
  }
  return view
}

export async function getFromMemoryDoc(db, viewName) {
  let view = await db.get(generateMemoryViewID(viewName))
  if (view) {
    view = view.view
  } else {
    throw { status: 404, message: "Unable to get view" }
  }
  return view
}
