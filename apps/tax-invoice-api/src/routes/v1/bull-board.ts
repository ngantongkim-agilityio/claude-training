import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import type { Express } from 'express'

// Configs
import { isTest } from '@/configs'

// Middlewares
import { authenticate, checkRole } from '@/middlewares'

// Queue
import { reportEmailQueue } from '@/modules/reports/queue'

// Types
import { UserRole } from '@/types'

const bullBoardPath = '/admin/queues'

export const bullBoardRoutes = (app: Express) => {
  // Tests should not initialize Bull Board because its queue adapter opens Redis
  // connections; production keeps the dashboard available for live debugging.
  if (isTest) {
    return
  }

  const serverAdapter = new ExpressAdapter()
  // The adapter base path must match the Express mount path so Bull Board assets
  // and navigation links resolve correctly behind the admin route.
  serverAdapter.setBasePath(bullBoardPath)

  createBullBoard({
    queues: [new BullMQAdapter(reportEmailQueue)],
    serverAdapter,
  })

  // Bull Board exposes job payloads and retry controls, so it must stay behind
  // authenticated admin access rather than the public API router.
  app.use(
    bullBoardPath,
    authenticate,
    checkRole(UserRole.ADMIN),
    serverAdapter.getRouter(),
  )
}
