import userRoutes from "./global/users"
import configRoutes from "./global/configs"
import workspaceRoutes from "./global/workspaces"
import templateRoutes from "./global/templates"
import emailRoutes from "./global/email"
import authRoutes from "./global/auth"
import roleRoutes from "./global/roles"
import sessionRoutes from "./global/sessions"
import environmentRoutes from "./system/environment"
import tenantsRoutes from "./system/tenants"
import appRoutes from "./app"

export const routes = [
  configRoutes,
  userRoutes,
  workspaceRoutes,
  authRoutes,
  appRoutes,
  templateRoutes,
  tenantsRoutes,
  emailRoutes,
  sessionRoutes,
  roleRoutes,
  environmentRoutes,
]
