import { POSTHOG_TOKEN, ENABLE_ANALYTICS, SELF_HOSTED } from "../../environment"
import PostHog from "posthog-node"

let posthogClient

if (POSTHOG_TOKEN && ENABLE_ANALYTICS && !SELF_HOSTED) {
  posthogClient = new PostHog(POSTHOG_TOKEN)
}

export async function isEnabled(ctx) {
  ctx.body = {
    enabled: !SELF_HOSTED && ENABLE_ANALYTICS === "true",
  }
}

export async function endUserPing(ctx) {
  if (!posthogClient) {
    ctx.body = {
      ping: false,
    }
    return
  }

  posthogClient.identify({
    distinctId: ctx.user && ctx.user._id,
    properties: {},
  })
  posthogClient.capture({
    event: "budibase:end_user_ping",
    distinctId: ctx.user && ctx.user._id,
    properties: {
      appId: ctx.appId,
    },
  })

  ctx.body = {
    ping: true,
  }
}
