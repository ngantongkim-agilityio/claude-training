import jwt from 'jsonwebtoken'

// Types
import { UserRole } from '@/types'

// Constants
import { JWT_CONFIG } from '../constants'

interface TokenPayload {
  email: string
  role: UserRole
}

/**
 * Generate signed JWT token for authenticated user
 * @param payload - Must include at least email and role
 * @returns Signed JWT string
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.SECRET as jwt.Secret, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  })
}
