import { auth, InsufficientScopeError } from 'express-oauth2-jwt-bearer'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Constants
import {
  AUTH0_CONFIG,
  JWT_CONFIG,
  STATUS_CODE,
  ERROR_MESSAGE,
} from '@/constants'

// Services
import { userService } from '@/container'

// Configs
import { createModuleLogger, env } from '@/configs'

// Types
import { UserRole } from '@/types'

const logger = createModuleLogger('AuthMiddleware')

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Auth0DecodedToken {
  sub: string
  email?: string
  name?: string
  iat: number
  exp: number
  aud: string | string[]
  iss: string
}

interface LocalJwtPayload {
  email: string
  role: UserRole
  iat: number
  exp: number
}

type TokenType = 'JWS' | 'JWE' | 'unknown'

type TokenSource = 'authorization' | 'cookie'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Detect token format: JWS (3 segments) is signed, JWE (5 segments) is encrypted
const detectTokenType = (
  token: string,
): { type: TokenType; segments: number } => {
  const segments = token.split('.').length
  if (segments === 3) return { type: 'JWS', segments }
  if (segments === 5) return { type: 'JWE', segments }
  return { type: 'unknown', segments }
}

// Auth0 access tokens don't include email by default — fetch from /userinfo endpoint
const fetchUserInfo = async (
  token: string,
): Promise<{ email?: string; name?: string }> => {
  const response = await fetch(`https://${AUTH0_CONFIG.DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    logger.warn('Failed to fetch userinfo from Auth0', {
      status: response.status,
    })
    return {}
  }

  const data = (await response.json()) as { email?: string; name?: string }
  return { email: data.email, name: data.name }
}

const extractToken = (
  req: Request,
): { token: string; source: TokenSource } | null => {
  // 1. Bearer token (API clients, curl, Postman)
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return { token: authHeader.slice(7), source: 'authorization' }
  }

  // 2. Cookie token (browser session)
  const cookieToken = req.cookies?.local_token
  if (cookieToken) {
    return { token: cookieToken, source: 'cookie' }
  }

  return null
}

const isSameOriginRequest = (req: Request): boolean => {
  const origin = req.headers.origin

  if (!origin) {
    return true
  }

  return origin === env.CORS_ORIGIN
}

const verifyLocalJwt = (token: string): LocalJwtPayload | null => {
  try {
    return jwt.verify(token, JWT_CONFIG.SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as LocalJwtPayload
  } catch {
    return null
  }
}

// ─── Auth0 Verification ──────────────────────────────────────────────────────

// Lazily initialized — null when AUTH0_DOMAIN is not configured (Auth0 disabled)
const auth0JwtCheck = AUTH0_CONFIG.DOMAIN
  ? auth({
      issuerBaseURL: `https://${AUTH0_CONFIG.DOMAIN}`,
      audience: AUTH0_CONFIG.AUDIENCE,
      tokenSigningAlg: 'RS256',
    })
  : null

// Verify Auth0 RS256 token using express-oauth2-jwt-bearer.
// Passes real req/res because the library calls req.is() internally.
// Falls back to /userinfo if email is not in the token payload.
export const verifyAuth0Token = (
  token: string,
  req: Request,
  res: Response,
): Promise<Auth0DecodedToken> => {
  return new Promise((resolve, reject) => {
    if (!AUTH0_CONFIG.DOMAIN || !auth0JwtCheck) {
      reject(new Error('Auth0 is not configured'))
      return
    }

    const originalAuthorization = req.headers.authorization
    req.headers.authorization = `Bearer ${token}`

    const { type, segments } = detectTokenType(token)

    const restoreAuthorization = () => {
      if (originalAuthorization) {
        req.headers.authorization = originalAuthorization
        return
      }

      delete req.headers.authorization
    }

    logger.info('Auth0 token analysis', {
      segments,
      tokenType: type,
      expectedIssuer: AUTH0_CONFIG.ISSUER,
      expectedAudience: AUTH0_CONFIG.AUDIENCE,
    })

    if (type === 'JWE') {
      const msg =
        'Received JWE (encrypted) token. This API only accepts JWS (signed) RS256 tokens. ' +
        'Disable Access Token Encryption in Auth0 Dashboard > APIs > Settings.'
      logger.warn(msg)
      restoreAuthorization()
      reject(new Error(msg))
      return
    }

    if (type === 'unknown') {
      const msg = `Malformed token: expected 3 segments (JWS), got ${segments}`
      logger.warn(msg)
      restoreAuthorization()
      reject(new Error(msg))
      return
    }

    auth0JwtCheck(req, res, (async (err?: unknown) => {
      restoreAuthorization()

      if (err) {
        if (err instanceof InsufficientScopeError) {
          logger.warn('Auth0 token insufficient scope', { error: err.message })
        } else if (err instanceof Error) {
          logger.warn('Auth0 token verification failed', { error: err.message })
        }
        reject(err instanceof Error ? err : new Error(String(err)))
        return
      }

      const payload = (req as any).auth?.payload
      if (!payload) {
        reject(new Error('Auth0 token payload not found after verification'))
        return
      }

      logger.info('Auth0 token verified', {
        issuer: payload.iss,
        audience: payload.aud,
        sub: payload.sub,
      })

      // Auth0 custom claims are namespaced (e.g. "https://domain/email") per OIDC spec
      let email = payload.email || payload[`${AUTH0_CONFIG.ISSUER}email`]
      let name = payload.name || payload[`${AUTH0_CONFIG.ISSUER}name`]

      if (!email) {
        logger.info('Email not in token, fetching from /userinfo')
        const userInfo = await fetchUserInfo(token)
        email = userInfo.email
        name = name || userInfo.name
      }

      resolve({
        sub: payload.sub,
        email,
        name,
        iat: payload.iat,
        exp: payload.exp,
        aud: payload.aud,
        iss: payload.iss,
      } as Auth0DecodedToken)
    }) as NextFunction)
  })
}

// ─── Middleware ───────────────────────────────────────────────────────────────

// Dual-auth strategy: try local JWT (HS256) first — cheaper, no network call.
// Falls back to Auth0 (RS256) if local verification fails.
// Resolves authenticated user into req.currentUser for downstream handlers.
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const extractedToken = extractToken(req)

  if (!extractedToken) {
    res.status(STATUS_CODE.UNAUTHORIZED).json({
      status: 'error',
      message: ERROR_MESSAGE.UNAUTHORIZED,
    })
    return
  }

  // Cookies are browser-managed credentials, so reject cross-origin cookie auth.
  if (extractedToken.source === 'cookie' && !isSameOriginRequest(req)) {
    res.status(STATUS_CODE.UNAUTHORIZED).json({
      status: 'error',
      message: ERROR_MESSAGE.UNAUTHORIZED,
    })
    return
  }

  const { token } = extractedToken

  const localPayload = verifyLocalJwt(token)

  if (localPayload) {
    req.currentUser = {
      email: localPayload.email,
      role: localPayload.role,
    }
    next()
    return
  }

  try {
    const auth0Payload = await verifyAuth0Token(token, req, res)

    if (!auth0Payload.email) {
      logger.warn('Auth0 token missing email claim')
      res.status(STATUS_CODE.UNAUTHORIZED).json({
        status: 'error',
        message: ERROR_MESSAGE.UNAUTHORIZED,
      })
      return
    }

    const user = await userService.findOrCreateByAuth0({
      sub: auth0Payload.sub,
      email: auth0Payload.email,
      name: auth0Payload.name,
    })

    req.currentUser = {
      email: user.email,
      role: user.role,
    }

    next()
  } catch (err) {
    logger.warn(
      'Authentication failed - both local and Auth0 verification failed',
      { error: err instanceof Error ? err.message : err },
    )

    res.status(STATUS_CODE.UNAUTHORIZED).json({
      status: 'error',
      message: ERROR_MESSAGE.UNAUTHORIZED,
    })
  }
}

// Role-based access control — checks req.currentUser.role against required role
export const checkRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const user = req.currentUser

    if (!user || user.role !== requiredRole) {
      return res.status(STATUS_CODE.FORBIDDEN).json({
        status: 'error',
        message: ERROR_MESSAGE.FORBIDDEN,
      })
    }

    next()
  }
}
