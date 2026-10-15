import { Algorithm } from 'jsonwebtoken'
import { env } from '@/configs'

type StringValue = `${number}${'s' | 'm' | 'h' | 'd'}`

// Local JWT configuration for HS256 symmetric token signing/verification
export const JWT_CONFIG: {
  SECRET: string
  ALGORITHM: Algorithm
  EXPIRES_IN: number | StringValue
  REQUEST_PROPERTY: string
} = {
  SECRET: env.JWT_SECRET,
  ALGORITHM: 'HS256' as Algorithm,
  REQUEST_PROPERTY: 'auth',
  EXPIRES_IN: '7d',
}

// Auth0 configuration for RS256 asymmetric token verification
// DOMAIN and AUDIENCE are optional — when empty, Auth0 auth is disabled
export const AUTH0_CONFIG = {
  DOMAIN: env.AUTH0_DOMAIN || '',
  AUDIENCE: env.AUTH0_AUDIENCE || '',
  // Derived issuer URL used for token validation and namespaced claims
  get ISSUER() {
    return this.DOMAIN ? `https://${this.DOMAIN}/` : ''
  },
  // JWKS endpoint for fetching Auth0 public signing keys
  get JWKS_URI() {
    return this.DOMAIN ? `https://${this.DOMAIN}/.well-known/jwks.json` : ''
  },
}
