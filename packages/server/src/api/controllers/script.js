import ScriptRunner from "../../utilities/scriptRunner"

export async function execute(ctx) {
  const { script, context } = ctx.request.body
  const runner = new ScriptRunner(script, context)
  ctx.body = runner.execute()
}

export async function save(ctx) {
  ctx.throw(501, "Not currently implemented")
}
