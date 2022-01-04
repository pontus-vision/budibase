import { createBullBoard } from "@bull-board/api"
import { BullAdapter } from "@bull-board/api/bullAdapter"
import { KoaAdapter } from "@bull-board/koa"
import env from "../environment"
const Queue = env.isTest()
  ? require("../utilities/queue/inMemoryQueue")
  : require("bull")
import { JobQueues } from "../constants"
import { utils } from "@budibase/auth/redis"
const { opts, redisProtocolUrl } = utils.getRedisOptions()

const CLEANUP_PERIOD_MS = 60 * 1000
const queueConfig = redisProtocolUrl || { redis: opts }
let cleanupInternal = null

let automationQueue = new Queue(JobQueues.AUTOMATIONS, queueConfig)

async function cleanup() {
  await automationQueue.clean(CLEANUP_PERIOD_MS, "completed")
}

const PATH_PREFIX = "/bulladmin"

export const init = () => {
  // cleanup the events every 5 minutes
  if (!cleanupInternal) {
    cleanupInternal = setInterval(cleanup, CLEANUP_PERIOD_MS)
    // fire off an initial cleanup
    cleanup().catch(err => {
      console.error(`Unable to cleanup automation queue initially - ${err}`)
    })
  }
  // Set up queues for bull board admin
  const queues = [automationQueue]
  const adapters = []
  const serverAdapter = new KoaAdapter()
  for (let queue of queues) {
    adapters.push(new BullAdapter(queue))
  }
  createBullBoard({
    queues: adapters,
    serverAdapter,
  })
  serverAdapter.setBasePath(PATH_PREFIX)
  return serverAdapter.registerPlugin()
}

export const queue = automationQueue
