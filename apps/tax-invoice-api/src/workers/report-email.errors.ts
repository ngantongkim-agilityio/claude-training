import { Data } from 'effect'

/**
 * Tagged error types for the report-email Effect pipeline.
 * Each error carries the original cause for observability while
 * enabling type-safe pattern matching via Effect's catchTag.
 */

export class ReportGenerationError extends Data.TaggedError(
  'ReportGenerationError',
)<{
  readonly cause: unknown
}> {}

export class PdfGenerationError extends Data.TaggedError(
  'PdfGenerationError',
)<{
  readonly cause: unknown
}> {}

export class EmailDeliveryError extends Data.TaggedError(
  'EmailDeliveryError',
)<{
  readonly cause: unknown
}> {}
