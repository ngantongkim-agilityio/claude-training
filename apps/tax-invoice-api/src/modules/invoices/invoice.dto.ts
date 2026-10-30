import { z } from 'zod'
import { ERROR_MESSAGE } from '@/constants'
import { PaginationSchema, PaginationMetaSchema } from '@/schemas/pagination'
import {
  InvoiceEventType,
  InvoiceHistory,
  InvoiceStatus,
  UserRole,
} from '@/types'

/**
 * Request Schemas
 */
export const InvoiceInputSchema = z.object({
  amount: z
    .number(ERROR_MESSAGE.MUST_BE_NUMBER('Amount'))
    .positive(ERROR_MESSAGE.MUST_BE_NON_NEGATIVE('Amount')),

  tax: z
    .number(ERROR_MESSAGE.MUST_BE_NUMBER('Tax'))
    .positive(ERROR_MESSAGE.MUST_BE_NON_NEGATIVE('Tax'))
    .optional(),

  description: z.string().optional(),
})

export const CreateInvoiceSchema = InvoiceInputSchema
export const UpdateInvoiceSchema = InvoiceInputSchema.partial()

// Reason and comment share the same length limit (KAN-5)
const STATUS_NOTE_MAX_LENGTH = 500

// Checked after trimming. Each field gets at most one message, because `parseRequest`
// keeps only the last issue per field. A value of only spaces counts as absent.
const checkStatusNote = (
  data: { status: InvoiceStatus; reason?: string; comment?: string },
  ctx: z.RefinementCtx,
): void => {
  const { status, reason, comment } = data

  if (status === InvoiceStatus.REJECTED) {
    if (!reason) {
      ctx.addIssue({
        code: 'custom',
        message: ERROR_MESSAGE.IS_REQUIRED('Reason'),
        path: ['reason'],
      })
    } else if (reason.length > STATUS_NOTE_MAX_LENGTH) {
      ctx.addIssue({
        code: 'custom',
        message: ERROR_MESSAGE.MUST_BE_AT_MOST(
          'Reason',
          STATUS_NOTE_MAX_LENGTH,
        ),
        path: ['reason'],
      })
    }
  } else if (reason) {
    ctx.addIssue({
      code: 'custom',
      message: ERROR_MESSAGE.ONLY_ALLOWED_WHEN_STATUS(
        'Reason',
        InvoiceStatus.REJECTED,
      ),
      path: ['reason'],
    })
  }

  if (status !== InvoiceStatus.APPROVED) {
    if (comment) {
      ctx.addIssue({
        code: 'custom',
        message: ERROR_MESSAGE.ONLY_ALLOWED_WHEN_STATUS(
          'Comment',
          InvoiceStatus.APPROVED,
        ),
        path: ['comment'],
      })
    }
  } else if (comment && comment.length > STATUS_NOTE_MAX_LENGTH) {
    ctx.addIssue({
      code: 'custom',
      message: ERROR_MESSAGE.MUST_BE_AT_MOST('Comment', STATUS_NOTE_MAX_LENGTH),
      path: ['comment'],
    })
  }
}

export const UpdateInvoiceStatusSchema = z
  .object({
    status: z.enum(InvoiceStatus),
    reason: z
      .string(ERROR_MESSAGE.IS_INVALID('Reason'))
      .trim()
      .optional()
      .openapi({
        description:
          'Required when status is rejected, and allowed only then. Trimmed; 1–500 characters.',
        example: 'Tax should be 10% of the amount, not 8%.',
      }),
    comment: z
      .string(ERROR_MESSAGE.IS_INVALID('Comment'))
      .trim()
      .optional()
      .openapi({
        description:
          'Optional, and allowed only when status is approved. Trimmed; at most 500 characters.',
        example: 'Matches PO-2291.',
      }),
  })
  .superRefine(checkStatusNote)

export const InvoiceParamsSchema = z.object({
  invoiceNumber: z.string().min(1),
})

export const GetInvoicesQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(InvoiceStatus).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sortBy: z.enum(['amount', 'createdAt', 'updatedAt'] as const).optional(),
  order: z.enum(['asc', 'desc'] as const).optional(),
})

export const GetInvoicesV2QuerySchema = GetInvoicesQuerySchema.extend({
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
})

/**
 * Response Schemas
 */
export const InvoiceHistorySchema = z.object({
  // null only for legacy entries whose type can't be inferred
  eventType: z.enum(InvoiceEventType).nullable(),
  // null for legacy entries, which never recorded who acted
  actor: z.string().nullable(),
  // Present only on rejected events (reason) and approved events with a comment
  reason: z.string().optional(),
  comment: z.string().optional(),
  changes: z.record(z.string(), z.unknown()),
  legacy: z.literal(true).optional(),
  createdAt: z.string().optional(), // Changed to string for API JSON consistency
})

export const InvoiceResponseSchema = z.object({
  invoiceNumber: z.string(),
  user: z.string(),
  status: z.enum(InvoiceStatus),
  amount: z.number(),
  tax: z.number().optional(),
  description: z.string().optional(),
  histories: z.array(InvoiceHistorySchema).optional(),
  createdAt: z.string().optional(), // Changed to string for API JSON consistency
  updatedAt: z.string().optional(), // Changed to string for API JSON consistency
})

export const CreateInvoiceResponseSchema = z.object({
  invoiceNumber: z.string(),
  status: z.enum(InvoiceStatus),
})

export const UpdateInvoiceStatusResponseSchema = z.object({
  invoiceNumber: z.string(),
  status: z.enum(InvoiceStatus),
})

export const UpdateInvoiceInfoResponseSchema = z.object({
  invoiceNumber: z.string(),
  updatedFields: z.array(z.string()),
})

export const DeleteInvoiceResponseSchema = z.object({
  invoiceNumber: z.string(),
  deleted: z.boolean(),
})

export const GetInvoiceHistoryResponseSchema = z.object({
  histories: z.array(InvoiceHistorySchema),
})

export const GetInvoiceResponseSchema = z.object({
  invoice: InvoiceResponseSchema,
})

export const GetInvoicesResponseSchema = z.object({
  invoices: z.array(InvoiceResponseSchema),
  pagination: PaginationMetaSchema,
})

/**
 * Domain Entities (Database Layer)
 */
export type InvoiceEntity = {
  invoiceNumber: string
  user: string
  status: InvoiceStatus
  amount: number
  tax?: number
  description?: string
  isDeleted?: boolean
  histories: InvoiceHistory[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Request DTOs
 */
export type CreateInvoiceRequestDTO = z.infer<typeof CreateInvoiceSchema> & {
  user: string
}

export type GetInvoicesInputDTO = z.infer<typeof GetInvoicesQuerySchema>

export type GetInvoicesRequestDTO = GetInvoicesInputDTO & {
  userEmail: string
  role: UserRole
}

export type GetInvoicesV2InputDTO = z.infer<typeof GetInvoicesV2QuerySchema>

export type GetInvoicesV2RequestDTO = GetInvoicesV2InputDTO & {
  userEmail: string
  role: UserRole
}

export type GetInvoiceRequestDTO = {
  invoiceNumber: string
  userEmail: string
  role: UserRole
}

export type UpdateInvoiceStatusRequestDTO = z.infer<
  typeof UpdateInvoiceStatusSchema
> & {
  invoiceNumber: string
  userEmail: string
  role: UserRole
}

export type UpdateInvoiceInfoRequestDTO = z.infer<
  typeof UpdateInvoiceSchema
> & {
  invoiceNumber: string
  userEmail: string
}

export type DeleteInvoiceRequestDTO = {
  invoiceNumber: string
  userEmail: string
}

export type GetInvoiceHistoryRequestDTO = {
  invoiceNumber: string
  userEmail: string
  role: UserRole
}

/**
 * Response DTOs
 */
export type InvoiceResponseDTO = z.infer<typeof InvoiceResponseSchema>
export type CreateInvoiceResponseDTO = z.infer<
  typeof CreateInvoiceResponseSchema
>
export type UpdateInvoiceStatusResponseDTO = z.infer<
  typeof UpdateInvoiceStatusResponseSchema
>
export type UpdateInvoiceInfoResponseDTO = z.infer<
  typeof UpdateInvoiceInfoResponseSchema
>
export type DeleteInvoiceResponseDTO = z.infer<
  typeof DeleteInvoiceResponseSchema
>
export type GetInvoiceHistoryResponseDTO = z.infer<
  typeof GetInvoiceHistoryResponseSchema
>
export type GetInvoiceResponseDTO = z.infer<typeof GetInvoiceResponseSchema>
export type GetInvoicesResponseDTO = z.infer<typeof GetInvoicesResponseSchema>
