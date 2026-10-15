import { z } from 'zod'

export const PaginationSchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
})

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})
