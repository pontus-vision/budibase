const WEBHOOK_ENDPOINTS = new RegExp(
  ["webhooks/trigger", "webhooks/schema"].join("|")
)

export const isWebhookEndpoint = ctx => {
  return WEBHOOK_ENDPOINTS.test(ctx.request.url)
}
