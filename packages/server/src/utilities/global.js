import { getMultiIDParams, getGlobalIDFromUserMetadataID } from "../db/utils"
import { BUILTIN_ROLE_IDS } from "@budibase/auth/roles"
import { getDeployedAppID } from "@budibase/auth/db"
import { getGlobalUserParams } from "@budibase/auth/db"
import { user as userCache } from "@budibase/auth/cache"
import { getGlobalDB, isUserInAppTenant } from "@budibase/auth/tenancy"
import env from "../environment"

export const updateAppRole = (appId, user) => {
  if (!user || !user.roles) {
    return user
  }
  // if in an multi-tenancy environment make sure roles are never updated
  if (env.MULTI_TENANCY && !isUserInAppTenant(appId, user)) {
    delete user.builder
    delete user.admin
    user.roleId = BUILTIN_ROLE_IDS.PUBLIC
    return user
  }
  // always use the deployed app
  user.roleId = user.roles[getDeployedAppID(appId)]
  // if a role wasn't found then either set as admin (builder) or public (everyone else)
  if (!user.roleId && user.builder && user.builder.global) {
    user.roleId = BUILTIN_ROLE_IDS.ADMIN
  } else if (!user.roleId) {
    user.roleId = BUILTIN_ROLE_IDS.PUBLIC
  }
  delete user.roles
  return user
}

function processUser(appId, user) {
  if (user) {
    delete user.password
  }
  return updateAppRole(appId, user)
}

export const getCachedSelf = async (ctx, appId) => {
  // this has to be tenant aware, can't depend on the context to find it out
  // running some middlewares before the tenancy causes context to break
  const user = await userCache.getUser(ctx.user._id)
  return processUser(appId, user)
}

export const getRawGlobalUser = async userId => {
  const db = getGlobalDB()
  return db.get(getGlobalIDFromUserMetadataID(userId))
}

export const getGlobalUser = async (appId, userId) => {
  let user = await getRawGlobalUser(userId)
  return processUser(appId, user)
}

export const getGlobalUsers = async (appId = null, users = null) => {
  const db = getGlobalDB()
  let globalUsers
  if (users) {
    const globalIds = users.map(user => getGlobalIDFromUserMetadataID(user._id))
    globalUsers = (await db.allDocs(getMultiIDParams(globalIds))).rows.map(
      row => row.doc
    )
  } else {
    globalUsers = (
      await db.allDocs(
        getGlobalUserParams(null, {
          include_docs: true,
        })
      )
    ).rows.map(row => row.doc)
  }
  globalUsers = globalUsers
    .filter(user => user != null)
    .map(user => {
      delete user.password
      delete user.forceResetPassword
      return user
    })
  if (!appId) {
    return globalUsers
  }
  return globalUsers.map(user => updateAppRole(appId, user))
}

export const getGlobalUsersFromMetadata = async (appId, users) => {
  const globalUsers = await getGlobalUsers(appId, users)
  return users.map(user => {
    const globalUser = globalUsers.find(
      globalUser => globalUser && user._id.includes(globalUser._id)
    )
    return {
      ...globalUser,
      // doing user second overwrites the id and rev (always metadata)
      ...user,
    }
  })
}
