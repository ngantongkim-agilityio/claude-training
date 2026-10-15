import { Worker } from 'bullmq'
import { Effect } from 'effect'

// configs
import {
  closeRedisConnections,
  createWorkerConnection,
  createModuleLogger,
  Database,
} from '@/configs'

// queue
import {
  REPORT_EMAIL_QUEUE,
  reportEmailQueueEvents,
} from '@/modules/reports/queue'
import type { ReportEmailJobData } from '@/modules/reports/queue/report-email.queue'

// services
import { ReportService, PdfService, EmailService } from '@/modules/reports'

// Effect pipeline
import { makeReportEmailPipeline } from './report-email.pipeline'

const logger = createModuleLogger('ReportEmailWorker')

/**
 * Worker runs as a standalone process, independent of the main API server.
 * Instantiates its own service dependencies since it doesn't share
 * the app's DI container.
 */
const pdfService = new PdfService()
const reportService = new ReportService(pdfService)
const emailService = new EmailService()

const processReportEmail = makeReportEmailPipeline({
  reportService,
  emailService,
})

const workerConnection = createWorkerConnection()

const worker = new Worker<ReportEmailJobData>(
  REPORT_EMAIL_QUEUE,
  async (job) => {
    // Record timing and attempt context at the start so success and failure logs
    // can be correlated with retry behavior and slow external dependencies.
    const startedAt = Date.now()
    const attempt = job.attemptsMade + 1

    logger.info('Processing report email job', {
      jobId: job.id,
      queueName: REPORT_EMAIL_QUEUE,
      attempt,
      recipientEmail: job.data.recipientEmail,
    })

    // Run the Effect pipeline, mapping tagged errors to enriched log entries
    // so operators can distinguish PDF failures from SMTP failures in alerts.
    const pipeline = processReportEmail(job.data).pipe(
      Effect.catchTag('PdfGenerationError', (err) => {
        const error = Object.assign(new Error('PDF generation failed'), {
          phase: 'pdf' as const,
          cause: err.cause,
        })
        return Effect.fail(error)
      }),
      Effect.catchTag('EmailDeliveryError', (err) => {
        const error = Object.assign(new Error('Email delivery failed'), {
          phase: 'email' as const,
          cause: err.cause,
        })
        return Effect.fail(error)
      }),
    )

    await Effect.runPromise(pipeline)

    // Duration is logged after SMTP delivery to identify whether delays came from
    // report generation, email delivery, or worker saturation.
    logger.info('Report email job completed', {
      jobId: job.id,
      queueName: REPORT_EMAIL_QUEUE,
      attempt,
      recipientEmail: job.data.recipientEmail,
      durationMs: Date.now() - startedAt,
    })
  },
  {
    connection: workerConnection,
    concurrency: 3,
    // Wait for MongoDB and Redis readiness before processing so deployments do
    // not immediately fail queued jobs while dependencies are still connecting.
    autorun: false,
  },
)

// Failed jobs include retry counts and stack traces so operators can separate
// transient retry noise from final failures that need manual investigation.
worker.on('failed', (job, err) => {
  logger.error('Report email job failed', {
    jobId: job?.id,
    queueName: REPORT_EMAIL_QUEUE,
    attemptsMade: job?.attemptsMade,
    attempt: job ? job.attemptsMade + 1 : undefined,
    maxAttempts: job?.opts.attempts,
    recipientEmail: job?.data.recipientEmail,
    error: err.message,
    stack: err.stack,
  })
})

// A stalled job may be retried by BullMQ, so this log is important evidence when
// debugging possible duplicate report generation or duplicate email delivery.
worker.on('stalled', (jobId) => {
  logger.warn('Report email job stalled', {
    jobId,
    queueName: REPORT_EMAIL_QUEUE,
  })
})

// Worker-level errors are not tied to a single job; logging them separately
// catches Redis and BullMQ runtime failures that would otherwise be hidden.
worker.on('error', (error) => {
  logger.error('Report email worker error', {
    queueName: REPORT_EMAIL_QUEUE,
    error: error.message,
    stack: error.stack,
  })
})

// Graceful shutdown — stop taking new jobs, wait briefly for active work, then close connections
let isShuttingDown = false

// Bound shutdown waits so deploys do not hang forever on stuck SMTP, Redis, or
// PDF work; the process exits non-zero when cleanup cannot finish safely.
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

const shutdown = async () => {
  // Multiple signals can arrive during container termination; only the first one
  // should run cleanup to avoid racing Redis and MongoDB connection closes.
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  logger.info('Shutting down report email worker...')

  try {
    // Close BullMQ first so no new jobs start while active jobs drain.
    await withTimeout(worker.close(), 25000, 'Report email worker close')
    // QueueEvents uses the shared Redis connection and must be closed explicitly
    // to avoid leaking observability consumers after worker shutdown.
    await reportEmailQueueEvents.close()
    await workerConnection.quit()
    await closeRedisConnections()
    await Database.getInstance().disconnect()
    process.exit(0)
  } catch (error) {
    logger.error('Report email worker shutdown failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Connect to database and start processing
const start = async () => {
  try {
    // Dependencies are connected before worker.run() because BullMQ workers start
    // pulling jobs immediately once run, and report generation requires MongoDB.
    await Database.getInstance().connect()
    await worker.waitUntilReady()
    worker.run()
    logger.info('Report email worker started')
  } catch (error) {
    logger.error('Report email worker failed to start', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Startup cleanup mirrors shutdown so failed deploys do not leave Redis
    // clients or queue event consumers open in the Node process.
    await worker.close().catch(() => undefined)
    await reportEmailQueueEvents.close().catch(() => undefined)
    await workerConnection.quit().catch(() => undefined)
    await closeRedisConnections().catch(() => undefined)
    await Database.getInstance()
      .disconnect()
      .catch(() => undefined)
    process.exit(1)
  }
}

void start()
