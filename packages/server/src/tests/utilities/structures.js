import { BUILTIN_ROLE_IDS } from "@budibase/auth/roles"
import { BUILTIN_PERMISSION_IDS } from "@budibase/auth/permissions"
import { createHomeScreen } from "../../constants/screens"
import { EMPTY_LAYOUT } from "../../constants/layouts"
import { cloneDeep } from "lodash/fp"

export const TENANT_ID = "default"

export const basicTable = () => {
  return {
    name: "TestTable",
    type: "table",
    key: "name",
    schema: {
      name: {
        type: "string",
        constraints: {
          type: "string",
        },
      },
      description: {
        type: "string",
        constraints: {
          type: "string",
        },
      },
    },
  }
}

export const basicAutomation = () => {
  return {
    name: "My Automation",
    screenId: "kasdkfldsafkl",
    live: true,
    uiTree: {},
    definition: {
      trigger: {
        inputs: {},
      },
      steps: [],
    },
    type: "automation",
  }
}

export const basicRow = tableId => {
  return {
    name: "Test Contact",
    description: "original description",
    tableId: tableId,
  }
}

export const basicLinkedRow = (tableId, linkedRowId, linkField = "link") => {
  // this is based on the basic linked tables you get from the test configuration
  return {
    ...basicRow(tableId),
    [linkField]: [linkedRowId],
  }
}

export const basicRole = () => {
  return {
    name: "NewRole",
    inherits: BUILTIN_ROLE_IDS.BASIC,
    permissionId: BUILTIN_PERMISSION_IDS.READ_ONLY,
  }
}

export const basicDatasource = () => {
  return {
    datasource: {
      type: "datasource",
      name: "Test",
      source: "POSTGRES",
      config: {},
    },
  }
}

export const basicQuery = datasourceId => {
  return {
    datasourceId: datasourceId,
    name: "New Query",
    parameters: [],
    fields: {},
    schema: {},
    queryVerb: "read",
  }
}

export const basicUser = role => {
  return {
    email: "bill@bill.com",
    password: "yeeooo",
    roleId: role,
  }
}

export const basicScreen = () => {
  return createHomeScreen()
}

export const basicLayout = () => {
  return cloneDeep(EMPTY_LAYOUT)
}

export const basicWebhook = automationId => {
  return {
    live: true,
    name: "webhook",
    action: {
      type: "automation",
      target: automationId,
    },
  }
}
