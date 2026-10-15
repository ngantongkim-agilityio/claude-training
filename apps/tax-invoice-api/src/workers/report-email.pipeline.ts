import { Effect } from 'effect'

// Services
import type { ReportService } from '@/modules/reports'
import type { EmailService } from '@/modules/reports/services/email.service'

// Types
import type { ReportEmailJobData } from '@/modules/reports/queue/report-email.queue'

// Errors
import { PdfGenerationError, EmailDeliveryError } from './report-email.errors'

/**
 * Effect pipeline for processing a report-email job.
 *
 * Wraps existing service calls (generateReportPdf, sendReportEmail) in
 * Effect.tryPromise with tagged errors so each failure mode is type-safe
 * and distinguishable for logging and retry decisions.
 *
 * The pipeline steps:
 *  1. Generate PDF report (DB query + PDF rendering)
 *  2. Send email with PDF attachment
 *
 * Both steps reuse the existing service implementations unchanged.
 */
export const makeReportEmailPipeline = ({
  reportService,
  emailService,
}: {
  reportService: ReportService
  emailService: EmailService
}) => {
  return (jobData: ReportEmailJobData) => {
    const { from, to, status, userEmail, userRole, recipientEmail } = jobData

    return Effect.gen(function* () {
      // Step 1: Generate the PDF report
      const pdfBuffer = yield* Effect.tryPromise({
        try: () =>
          reportService.generateReportPdf({
            from,
            to,
            status,
            userEmail,
            userRole,
          }),
        catch: (cause) => new PdfGenerationError({ cause }),
      })

      // Step 2: Send email with PDF attachment
      const filename = `invoice-report_${from}_${to}.pdf`

      yield* Effect.tryPromise({
        try: () =>
          emailService.sendReportEmail({
            to: recipientEmail,
            subject: `Invoice Report (${from} to ${to})`,
            pdfBuffer,
            filename,
          }),
        catch: (cause) => new EmailDeliveryError({ cause }),
      })

      return { filename, recipientEmail }
    })
  }
}

export type ReportEmailPipeline = ReturnType<typeof makeReportEmailPipeline>
