import {
  getAllSessions,
  getUserSessions,
  invalidateSessions,
} from "@budibase/auth/sessions"

export const fetch = async ctx => {
  ctx.body = await getAllSessions()
}

export const find = async ctx => {
  const { userId } = ctx.params
  const sessions = await getUserSessions(userId)
  ctx.body = sessions.map(session => session.value)
}

export const invalidateUser = async ctx => {
  const { userId } = ctx.params
  await invalidateSessions(userId)
  ctx.body = {
    message: "User sessions invalidated",
  }
}

export const selfSessions = async ctx => {
  const userId = ctx.user._id
  ctx.body = await getUserSessions(userId)
}

export const invalidateSession = async ctx => {
  const userId = ctx.user._id
  const { sessionId } = ctx.params
  await invalidateSessions(userId, sessionId)
  ctx.body = {
    message: "Session invalidated successfully.",
  }
}
