import { Schema, model, SchemaTypes } from 'mongoose'

// Types
import { Invoice, InvoiceHistory, InvoiceStatus } from '@/types'

const InvoiceHistorySchema = new Schema<InvoiceHistory>(
  {
    changes: {
      type: SchemaTypes.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

const InvoiceSchema = new Schema<Invoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    user: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
    },
    amount: { type: Number, required: true },
    tax: Number,
    description: String,
    isDeleted: { type: Boolean, default: false },
    histories: [InvoiceHistorySchema],
  },
  {
    timestamps: true,
  },
)

InvoiceSchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: 'email',
  justOne: true,
})

InvoiceSchema.index({ createdAt: -1 })

export const InvoiceModel = model<Invoice>('Invoice', InvoiceSchema)
