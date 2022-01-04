import { execSync } from "child_process"
import { processStringSync } from "@budibase/string-templates"
import automationUtils from "../automationUtils"

export const definition = {
  name: "Bash Scripting",
  tagline: "Execute a bash command",
  icon: "JourneyEvent",
  description: "Run a bash script",
  type: "ACTION",
  internal: true,
  stepId: "EXECUTE_BASH",
  inputs: {},
  schema: {
    inputs: {
      properties: {
        code: {
          type: "string",
          customType: "code",
          title: "Code",
        },
      },
      required: ["code"],
    },
    outputs: {
      properties: {
        stdout: {
          type: "string",
          description: "Standard output of your bash command or script",
        },
        success: {
          type: "boolean",
          description: "Whether the command was successful",
        },
      },
    },
    required: ["stdout"],
  },
}

export const run = async function ({ inputs, context }) {
  if (inputs.code == null) {
    return {
      stdout: "Budibase bash automation failed: Invalid inputs",
    }
  }

  try {
    const command = processStringSync(inputs.code, context)

    let stdout,
      success = true
    try {
      stdout = execSync(command, { timeout: 500 }).toString()
    } catch (err) {
      stdout = err.message
      success = false
    }

    return {
      stdout,
      success,
    }
  } catch (err) {
    return {
      success: false,
      response: automationUtils.getError(err),
    }
  }
}
