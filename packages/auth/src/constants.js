export const UserStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
}

export const Cookies = {
  CurrentApp: "budibase:currentapp",
  Auth: "budibase:auth",
  Init: "budibase:init",
  OIDC_CONFIG: "budibase:oidc:config",
}

export const Headers = {
  API_KEY: "x-budibase-api-key",
  API_VER: "x-budibase-api-version",
  APP_ID: "x-budibase-app-id",
  TYPE: "x-budibase-type",
  TENANT_ID: "x-budibase-tenant-id",
}

export const GlobalRoles = {
  OWNER: "owner",
  ADMIN: "admin",
  BUILDER: "builder",
  WORKSPACE_MANAGER: "workspace_manager",
}

export const Configs = {
  SETTINGS: "settings",
  ACCOUNT: "account",
  SMTP: "smtp",
  GOOGLE: "google",
  OIDC: "oidc",
  OIDC_LOGOS: "logos_oidc",
}

export const MAX_VALID_DATE = new Date(2147483647000)
export const DEFAULT_TENANT_ID = "default"
