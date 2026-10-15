import { QueueEvents } from 'bullmq'

// Configs
import { createModuleLogger, getSharedRedisConnection } from '@/configs'

// Queue
import { REPORT_EMAIL_QUEUE } from './report-email.queue'

const logger = createModuleLogger('ReportEmailQueueEvents')

// QueueEvents observes lifecycle events across all worker instances, so these
// logs remain useful when production runs multiple replicas or a worker restarts.
export const reportEmailQueueEvents = new QueueEvents(REPORT_EMAIL_QUEUE, {
  connection: getSharedRedisConnection(),
})

// Completion events provide a queue-wide audit trail even if the processing
// worker's local completion log is unavailable after a process restart.
reportEmailQueueEvents.on('completed', ({ jobId }) => {
  logger.info('Report email job completed', {
    jobId,
    queueName: REPORT_EMAIL_QUEUE,
  })
})

// Failed events are emitted after BullMQ moves the job to failed state, making
// them the right place to correlate exhausted retries with operations alerts.
reportEmailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Report email job failed', {
    jobId,
    queueName: REPORT_EMAIL_QUEUE,
    error: failedReason,
  })
})

// Stalled events indicate a worker lost its lock or was blocked too long; these
// logs are key evidence when investigating duplicate processing or slow jobs.
reportEmailQueueEvents.on('stalled', ({ jobId }) => {
  logger.warn('Report email job stalled', {
    jobId,
    queueName: REPORT_EMAIL_QUEUE,
  })
})

// QueueEvents has its own Redis stream consumer; logging its errors prevents
// silent loss of queue-wide observability while workers continue processing jobs.
reportEmailQueueEvents.on('error', (error) => {
  logger.error('Report email queue events error', {
    queueName: REPORT_EMAIL_QUEUE,
    error: error.message,
    stack: error.stack,
  })
})
