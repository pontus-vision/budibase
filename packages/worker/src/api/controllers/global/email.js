import { sendEmail as sendMailImp } from "../../../utilities/email"
import { getGlobalDB } from "@budibase/auth/tenancy"

export const sendEmail = async ctx => {
  let {
    workspaceId,
    email,
    userId,
    purpose,
    contents,
    from,
    subject,
    automation,
  } = ctx.request.body
  let user
  if (userId) {
    const db = getGlobalDB()
    user = await db.get(userId)
  }
  const response = await sendMailImp(email, purpose, {
    workspaceId,
    user,
    contents,
    from,
    subject,
    automation,
  })
  ctx.body = {
    ...response,
    message: `Email sent to ${email}.`,
  }
}
