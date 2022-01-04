import { body } from "../../../middleware/joi-validator"
import { object, string, boolean, array } from "joi"

export function queryValidation() {
  return object({
    _id: string(),
    _rev: string(),
    name: string().required(),
    fields: object().required(),
    datasourceId: string().required(),
    readable: boolean(),
    parameters: array().items(
      object({
        name: string(),
        default: string().allow(""),
      })
    ),
    queryVerb: string().allow().required(),
    extra: object().optional(),
    schema: object({}).required().unknown(true),
    transformer: string().optional(),
    flags: object().optional(),
  })
}

export function generateQueryValidation() {
  // prettier-ignore
  return body(queryValidation())
}

export function generateQueryPreviewValidation() {
  // prettier-ignore
  return body(object({
    fields: object().required(),
    queryVerb: string().allow().required(),
    extra: object().optional(),
    datasourceId: string().required(),
    transformer: string().optional(),
    parameters: object({}).required().unknown(true)
  }))
}
