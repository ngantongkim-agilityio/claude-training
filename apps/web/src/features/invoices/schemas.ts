import { z } from "zod"

export const createInvoiceSchema = z.object({
  amount: z
    .number({ error: "Amount must be a valid number" })
    .positive("Amount must be greater than 0"),
  tax: z
    .number({ error: "Tax must be a valid number" })
    .positive("Tax must be greater than 0")
    .optional(),
  description: z.string().optional(),
})

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>

export const editInvoiceSchema = z.object({
  amount: z
    .number({ error: "Amount must be a valid number" })
    .positive("Amount must be greater than 0"),
  tax: z
    .number({ error: "Tax must be a valid number" })
    .positive("Tax must be greater than 0")
    .optional(),
  description: z.string().optional(),
})

export type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>

// Same limit as the API's reason/comment fields
export const REVIEW_NOTE_MAX = 500

export const rejectInvoiceSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Enter a reason to reject this invoice.")
    .max(REVIEW_NOTE_MAX, `Reason must be at most ${REVIEW_NOTE_MAX} characters`),
})

export type RejectInvoiceFormData = z.infer<typeof rejectInvoiceSchema>

export const approveInvoiceSchema = z.object({
  comment: z
    .string()
    .trim()
    .max(REVIEW_NOTE_MAX, `Comment must be at most ${REVIEW_NOTE_MAX} characters`)
    .optional(),
})

export type ApproveInvoiceFormData = z.infer<typeof approveInvoiceSchema>
