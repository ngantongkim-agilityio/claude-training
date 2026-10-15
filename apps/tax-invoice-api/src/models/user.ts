import { Schema, model } from 'mongoose'

// Types
import { User, UserRole, AuthProvider, UserStatus } from '@/types'

const UserSchema = new Schema<User>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      required: true,
      default: UserStatus.ACTIVE,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    authProviderId: { type: String },
  },
  {
    timestamps: true,
  },
)

export const UserModel = model<User>('User', UserSchema)
