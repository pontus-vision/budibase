import { readStaticFile } from "../../utilities/fileSystem"
import {
  EmailTemplatePurpose,
  TemplateTypes,
  TemplatePurpose,
  GLOBAL_OWNER,
} from "../index"
import { join } from "path"
import { getTemplateParams } from "@budibase/auth/db"
import { getGlobalDB } from "@budibase/auth/tenancy"

export const EmailTemplates = {
  [EmailTemplatePurpose.PASSWORD_RECOVERY]: readStaticFile(
    join(__dirname, "passwordRecovery.hbs")
  ),
  [EmailTemplatePurpose.INVITATION]: readStaticFile(
    join(__dirname, "invitation.hbs")
  ),
  [EmailTemplatePurpose.BASE]: readStaticFile(join(__dirname, "base.hbs")),
  [EmailTemplatePurpose.WELCOME]: readStaticFile(
    join(__dirname, "welcome.hbs")
  ),
  [EmailTemplatePurpose.CUSTOM]: readStaticFile(join(__dirname, "custom.hbs")),
}

export const addBaseTemplates = (templates, type = null) => {
  let purposeList
  switch (type) {
    case TemplateTypes.EMAIL:
      purposeList = Object.values(EmailTemplatePurpose)
      break
    default:
      purposeList = Object.values(TemplatePurpose)
      break
  }
  for (let purpose of purposeList) {
    // check if a template exists already for purpose
    if (templates.find(template => template.purpose === purpose)) {
      continue
    }
    if (exports.EmailTemplates[purpose]) {
      templates.push({
        contents: exports.EmailTemplates[purpose],
        purpose,
        type,
      })
    }
  }
  return templates
}

export const getTemplates = async ({ ownerId, type, id } = {}) => {
  const db = getGlobalDB()
  const response = await db.allDocs(
    getTemplateParams(ownerId || GLOBAL_OWNER, id, {
      include_docs: true,
    })
  )
  let templates = response.rows.map(row => row.doc)
  // should only be one template with ID
  if (id) {
    return templates[0]
  }
  if (type) {
    templates = templates.filter(template => template.type === type)
  }
  return addBaseTemplates(templates, type)
}

export const getTemplateByPurpose = async (type, purpose) => {
  const templates = await getTemplates({ type })
  return templates.find(template => template.purpose === purpose)
}
