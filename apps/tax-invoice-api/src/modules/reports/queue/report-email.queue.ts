import { Queue } from 'bullmq'

// Configs
import { getSharedRedisConnection, createModuleLogger } from '@/configs'

// Types
import { UserRole } from '@/types'

export const REPORT_EMAIL_QUEUE = 'report-email'

const logger = createModuleLogger('ReportEmailQueue')

// Keep the queue name in every log so production searches can distinguish
// report email jobs from other background queues as the system grows.
export interface ReportEmailJobData {
  from: string
  to: string
  status?: string
  userEmail: string
  userRole: UserRole
  recipientEmail: string
}

export const reportEmailQueue = new Queue<ReportEmailJobData>(
  REPORT_EMAIL_QUEUE,
  // Producers reuse the shared Redis connection so API requests do not create
  // one connection per enqueue operation under production traffic.
  { connection: getSharedRedisConnection() },
)

/**
 * Enqueue a report email job for async processing.
 * Uses exponential backoff (5s base) with 3 retry attempts
 * to handle transient SMTP or PDF generation failures.
 */
export const addReportEmailJob = async (data: ReportEmailJobData) => {
  const job = await reportEmailQueue.add('send-report', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    // Bound Redis memory while keeping enough recent history for incident review.
    removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
    // Failed jobs live longer because operators need time to inspect root causes.
    removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 },
  })

  // Queueing logs confirm the API accepted background work even before a worker
  // picks it up, which helps debug missing-email reports across API and worker logs.
  logger.info('Report email job queued', {
    jobId: job.id,
    queueName: REPORT_EMAIL_QUEUE,
    recipientEmail: data.recipientEmail,
    attempt: 0,
  })

  return job.id
}

export const getReportEmailQueueHealth = async () => {
  // These counts are intentionally lightweight and use BullMQ's queue state APIs;
  // they are suitable for admin health checks without introducing metrics storage.
  const [waiting, active, delayed, completed, failed] = await Promise.all([
    reportEmailQueue.getWaitingCount(),
    reportEmailQueue.getActiveCount(),
    reportEmailQueue.getDelayedCount(),
    reportEmailQueue.getCompletedCount(),
    reportEmailQueue.getFailedCount(),
  ])

  return {
    waiting,
    active,
    delayed,
    completed,
    failed,
  }
}
