function validate(schema, property) {
  // Return a Koa middleware function
  return (ctx, next) => {
    if (!schema) {
      return next()
    }
    let params = null
    if (ctx[property] != null) {
      params = ctx[property]
    } else if (ctx.request[property] != null) {
      params = ctx.request[property]
    }
    const { error } = schema.validate(params)
    if (error) {
      ctx.throw(400, `Invalid ${property} - ${error.message}`)
      return
    }
    return next()
  }
}

export const body = schema => {
  return validate(schema, "body")
}

export const params = schema => {
  return validate(schema, "params")
}
