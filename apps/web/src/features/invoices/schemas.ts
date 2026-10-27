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
