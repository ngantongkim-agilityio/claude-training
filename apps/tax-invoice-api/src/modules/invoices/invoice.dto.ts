import { z } from 'zod'
import { ERROR_MESSAGE } from '@/constants'
import { PaginationSchema, PaginationMetaSchema } from '@/schemas/pagination'
import { InvoiceStatus, UserRole } from '@/types'

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

export const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(InvoiceStatus),
})

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
  changes: z.record(z.string(), z.unknown()),
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
  histories: Array<{ changes: Record<string, unknown>; createdAt?: Date }>
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
