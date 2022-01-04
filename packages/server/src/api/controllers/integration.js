import { definitions } from "../../integrations"

export async function fetch(ctx) {
  // TODO: fetch these from a github repo etc
  ctx.status = 200
  ctx.body = definitions
}

export async function find(ctx) {
  ctx.status = 200
  ctx.body = definitions[ctx.params.type]
}
