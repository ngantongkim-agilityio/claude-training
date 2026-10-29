import { Schema, model, SchemaTypes } from 'mongoose'

// Types
import {
  Invoice,
  InvoiceEventType,
  InvoiceHistory,
  InvoiceStatus,
} from '@/types'

const InvoiceHistorySchema = new Schema<InvoiceHistory>(
  {
    // Not required: save() validates every embedded entry, and legacy entries have no eventType
    eventType: {
      type: String,
      enum: Object.values(InvoiceEventType),
    },
    // Email snapshot at the time of the action, never joined to User
    actor: String,
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
