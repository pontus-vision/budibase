import { setTenantId } from "../tenancy"
import ContextFactory from "../tenancy/FunctionContext"
import { buildMatcherRegex, matches } from "./matchers"

export default (
  allowQueryStringPatterns,
  noTenancyPatterns,
  opts = { noTenancyRequired: false }
) => {
  const allowQsOptions = buildMatcherRegex(allowQueryStringPatterns)
  const noTenancyOptions = buildMatcherRegex(noTenancyPatterns)

  return ContextFactory.getMiddleware(ctx => {
    const allowNoTenant =
      opts.noTenancyRequired || !!matches(ctx, noTenancyOptions)
    const allowQs = !!matches(ctx, allowQsOptions)
    setTenantId(ctx, { allowQs, allowNoTenant })
  })
}
