import { processEvent } from "./utils"
import { queue } from "./bullboard"

/**
 * This module is built purely to kick off the worker farm and manage the inputs/outputs
 */
export const init = function () {
  // this promise will not complete
  return queue.process(async job => {
    await processEvent(job)
  })
}

export const getQueues = () => {
  return [queue]
}

export { queue }
