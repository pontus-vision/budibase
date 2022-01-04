import { BUILTIN_ROLE_IDS } from "@budibase/auth/roles"
import { UserStatus, ObjectStoreBuckets } from "@budibase/auth"

export const JobQueues = {
  AUTOMATIONS: "automationQueue",
}

const FilterTypes = {
  STRING: "string",
  FUZZY: "fuzzy",
  RANGE: "range",
  EQUAL: "equal",
  NOT_EQUAL: "notEqual",
  EMPTY: "empty",
  NOT_EMPTY: "notEmpty",
  CONTAINS: "contains",
  NOT_CONTAINS: "notContains",
  ONE_OF: "oneOf",
}

export const NoEmptyFilterStrings = [
  FilterTypes.STRING,
  FilterTypes.FUZZY,
  FilterTypes.EQUAL,
  FilterTypes.NOT_EQUAL,
  FilterTypes.CONTAINS,
  FilterTypes.NOT_CONTAINS,
]

export const FieldTypes = {
  STRING: "string",
  LONGFORM: "longform",
  OPTIONS: "options",
  NUMBER: "number",
  BOOLEAN: "boolean",
  ARRAY: "array",
  DATETIME: "datetime",
  ATTACHMENT: "attachment",
  LINK: "link",
  FORMULA: "formula",
  AUTO: "auto",
  JSON: "json",
  INTERNAL: "internal",
}

export const SwitchableTypes = [
  exports.FieldTypes.STRING,
  exports.FieldTypes.OPTIONS,
  exports.FieldTypes.NUMBER,
  exports.FieldTypes.BOOLEAN,
]

export const RelationshipTypes = {
  ONE_TO_MANY: "one-to-many",
  MANY_TO_ONE: "many-to-one",
  MANY_TO_MANY: "many-to-many",
}

export const AuthTypes = {
  APP: "app",
  BUILDER: "builder",
  EXTERNAL: "external",
}

export const DataSourceOperation = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  BULK_CREATE: "BULK_CREATE",
  CREATE_TABLE: "CREATE_TABLE",
  UPDATE_TABLE: "UPDATE_TABLE",
  DELETE_TABLE: "DELETE_TABLE",
}

export const SortDirection = {
  ASCENDING: "ASCENDING",
  DESCENDING: "DESCENDING",
}

export const USERS_TABLE_SCHEMA = {
  _id: "ta_users",
  type: "table",
  views: {},
  name: "Users",
  // TODO: ADMIN PANEL - when implemented this doesn't need to be carried out
  schema: {
    email: {
      type: exports.FieldTypes.STRING,
      constraints: {
        type: exports.FieldTypes.STRING,
        email: true,
        length: {
          maximum: "",
        },
        presence: true,
      },
      fieldName: "email",
      name: "email",
    },
    firstName: {
      name: "firstName",
      fieldName: "firstName",
      type: exports.FieldTypes.STRING,
      constraints: {
        type: exports.FieldTypes.STRING,
        presence: false,
      },
    },
    lastName: {
      name: "lastName",
      fieldName: "lastName",
      type: exports.FieldTypes.STRING,
      constraints: {
        type: exports.FieldTypes.STRING,
        presence: false,
      },
    },
    roleId: {
      fieldName: "roleId",
      name: "roleId",
      type: exports.FieldTypes.OPTIONS,
      constraints: {
        type: exports.FieldTypes.STRING,
        presence: false,
        inclusion: Object.values(BUILTIN_ROLE_IDS),
      },
    },
    status: {
      fieldName: "status",
      name: "status",
      type: exports.FieldTypes.OPTIONS,
      constraints: {
        type: exports.FieldTypes.STRING,
        presence: false,
        inclusion: Object.values(UserStatus),
      },
    },
  },
  primaryDisplay: "email",
}

export const AutoFieldSubTypes = {
  CREATED_BY: "createdBy",
  CREATED_AT: "createdAt",
  UPDATED_BY: "updatedBy",
  UPDATED_AT: "updatedAt",
  AUTO_ID: "autoID",
}

export const OBJ_STORE_DIRECTORY = "/prod-budi-app-assets"

export const BaseQueryVerbs = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
}

export const MetadataTypes = {
  AUTOMATION_TEST_INPUT: "automationTestInput",
  AUTOMATION_TEST_HISTORY: "automationTestHistory",
}

export const InvalidColumns = {
  ID: "_id",
  REV: "_rev",
  TABLE_ID: "tableId",
}

export const BuildSchemaErrors = {
  NO_KEY: "no_key",
  INVALID_COLUMN: "invalid_column",
}

export { FilterTypes, ObjectStoreBuckets }
