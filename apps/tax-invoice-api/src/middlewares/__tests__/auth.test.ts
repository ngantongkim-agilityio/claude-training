import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { authenticate, verifyAuth0Token, checkRole } from '@/middlewares/auth'
import { userService } from '@/container'
import { STATUS_CODE, ERROR_MESSAGE, JWT_CONFIG } from '@/constants'
import { UserRole } from '@/types'
jest.mock('express-oauth2-jwt-bearer', () => {
  const handler = jest.fn()
  return {
    auth: jest.fn(() => handler),
    InsufficientScopeError: class InsufficientScopeError extends Error {},
    __handler: handler,
  }
})

jest.mock('@/container', () => ({
  userService: { findOrCreateByAuth0: jest.fn() },
}))

// Get reference to the mock handler created inside the factory
const mockAuthHandler = (
  jest.requireMock('express-oauth2-jwt-bearer') as any
).__handler

const createMockReq = (token?: string): Partial<Request> => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
})

const createCookieReq = (token: string): Partial<Request> => ({
  headers: {},
  cookies: { local_token: token },
})

const createMockRes = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

describe('Auth Middleware', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyAuth0Token', () => {
    it('should resolve with decoded token on valid JWS token', async () => {
      mockAuthHandler.mockImplementation((req: any, _res: any, next: any) => {
        req.auth = {
          payload: {
            sub: 'auth0|123456',
            email: 'user@example.com',
            name: 'Test User',
            iat: 1000,
            exp: 2000,
            aud: 'https://api.example.com',
            iss: 'https://test.auth0.com/',
          },
        }
        next()
      })

      const req = createMockReq('header.payload.signature')
      const res = createMockRes()
      const result = await verifyAuth0Token(
        'header.payload.signature',
        req as Request,
        res as Response,
      )

      expect(result).toMatchObject({
        sub: 'auth0|123456',
        email: 'user@example.com',
        name: 'Test User',
      })
    })

    it('should reject JWE tokens (5 segments)', async () => {
      const req = createMockReq('header.key.iv.ciphertext.tag')
      const res = createMockRes()
      await expect(
        verifyAuth0Token(
          'header.key.iv.ciphertext.tag',
          req as Request,
          res as Response,
        ),
      ).rejects.toThrow('Received JWE (encrypted) token')
    })

    it('should reject malformed tokens', async () => {
      const req = createMockReq('only-one-segment')
      const res = createMockRes()
      await expect(
        verifyAuth0Token(
          'only-one-segment',
          req as Request,
          res as Response,
        ),
      ).rejects.toThrow('Malformed token: expected 3 segments (JWS), got 1')
    })

    it('should reject expired tokens', async () => {
      mockAuthHandler.mockImplementation((_req: any, _res: any, next: any) => {
        next(new Error('jwt expired'))
      })
      const req = createMockReq('header.payload.signature')
      const res = createMockRes()
      await expect(
        verifyAuth0Token(
          'header.payload.signature',
          req as Request,
          res as Response,
        ),
      ).rejects.toThrow('jwt expired')
    })

    it('should reject when payload is missing', async () => {
      mockAuthHandler.mockImplementation((_req: any, _res: any, next: any) => {
        next()
      })
      const req = createMockReq('header.payload.signature')
      const res = createMockRes()
      await expect(
        verifyAuth0Token(
          'header.payload.signature',
          req as Request,
          res as Response,
        ),
      ).rejects.toThrow('Auth0 token payload not found after verification')
    })
  })

  describe('authenticate', () => {
    it('should return 401 if no Authorization header', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await authenticate(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.UNAUTHORIZED)
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: ERROR_MESSAGE.UNAUTHORIZED,
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should authenticate with valid local JWT', async () => {
      const payload = { email: 'user@example.com', role: UserRole.USER }
      const token = jwt.sign(payload, JWT_CONFIG.SECRET, {
        algorithm: JWT_CONFIG.ALGORITHM,
        expiresIn: '1h',
      })
      const req = createMockReq(token)
      const res = createMockRes()
      const next = jest.fn()

      await authenticate(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(req.currentUser).toMatchObject({
        email: 'user@example.com',
        role: UserRole.USER,
      })
      expect(mockAuthHandler).not.toHaveBeenCalled()
    })

    it('should authenticate with valid local JWT from cookie', async () => {
      const payload = { email: 'cookie@example.com', role: UserRole.USER }
      const token = jwt.sign(payload, JWT_CONFIG.SECRET, {
        algorithm: JWT_CONFIG.ALGORITHM,
        expiresIn: '1h',
      })
      const req = createCookieReq(token)
      const res = createMockRes()
      const next = jest.fn()

      await authenticate(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(req.currentUser).toMatchObject({
        email: 'cookie@example.com',
        role: UserRole.USER,
      })
      expect(mockAuthHandler).not.toHaveBeenCalled()
    })

    it('should reject cross-origin cookie authentication', async () => {
      const payload = { email: 'cookie@example.com', role: UserRole.USER }
      const token = jwt.sign(payload, JWT_CONFIG.SECRET, {
        algorithm: JWT_CONFIG.ALGORITHM,
        expiresIn: '1h',
      })
      const req = {
        ...createCookieReq(token),
        headers: { origin: 'https://evil.example.com' },
      }
      const res = createMockRes()
      const next = jest.fn()

      await authenticate(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.UNAUTHORIZED)
      expect(next).not.toHaveBeenCalled()
      expect(mockAuthHandler).not.toHaveBeenCalled()
    })

    it('should fall back to Auth0 when local JWT fails', async () => {
      mockAuthHandler.mockImplementation((req: any, _res: any, next: any) => {
        req.auth = {
          payload: {
            sub: 'auth0|789',
            email: 'auth0user@example.com',
            name: 'Auth0 User',
            iat: 1000,
            exp: 2000,
            aud: 'https://api.example.com',
            iss: 'https://test.auth0.com/',
          },
        }
        next()
      })
      ;(userService.findOrCreateByAuth0 as jest.Mock).mockResolvedValue({
        email: 'auth0user@example.com',
        role: UserRole.USER,
      })

      const req = createMockReq('invalid-local.but-valid.auth0-token')
      const res = createMockRes()
      const next = jest.fn()

      await authenticate(req as Request, res as Response, next)

      expect(mockAuthHandler).toHaveBeenCalled()
      expect(userService.findOrCreateByAuth0).toHaveBeenCalledWith({
        sub: 'auth0|789',
        email: 'auth0user@example.com',
        name: 'Auth0 User',
      })
      expect(next).toHaveBeenCalled()
      expect(req.currentUser).toMatchObject({
        email: 'auth0user@example.com',
        role: UserRole.USER,
      })
    })

    it('should use cookie token for Auth0 fallback when Authorization header is absent', async () => {
      mockAuthHandler.mockImplementation((req: any, _res: any, next: any) => {
        expect(req.headers.authorization).toBe(
          'Bearer invalid-local.but-valid.auth0-token',
        )
        req.auth = {
          payload: {
            sub: 'auth0|cookie',
            email: 'cookie-auth0@example.com',
            name: 'Cookie Auth0 User',
            iat: 1000,
            exp: 2000,
            aud: 'https://api.example.com',
            iss: 'https://test.auth0.com/',
          },
        }
        next()
      })
      ;(userService.findOrCreateByAuth0 as jest.Mock).mockResolvedValue({
        email: 'cookie-auth0@example.com',
        role: UserRole.USER,
      })

      const req = createCookieReq('invalid-local.but-valid.auth0-token')
      const res = createMockRes()
      const next = jest.fn()

      await authenticate(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect((req as Request).headers.authorization).toBeUndefined()
      expect(req.currentUser).toMatchObject({
        email: 'cookie-auth0@example.com',
        role: UserRole.USER,
      })
    })

    it('should return 401 when both local and Auth0 fail', async () => {
      mockAuthHandler.mockImplementation((_req: any, _res: any, next: any) => {
        next(new Error('invalid token'))
      })

      const req = createMockReq('totally.invalid.token')
      const res = createMockRes()
      const next = jest.fn()

      await authenticate(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.UNAUTHORIZED)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('checkRole', () => {
    it('should call next if user role matches', () => {
      const req = {
        currentUser: { email: 'admin@example.com', role: UserRole.ADMIN },
      } as unknown as Request
      const res = createMockRes()
      const next = jest.fn()

      checkRole(UserRole.ADMIN)(req, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should return 403 if user has wrong role', () => {
      const req = {
        currentUser: { email: 'user@example.com', role: UserRole.USER },
      } as unknown as Request
      const res = createMockRes()
      const next = jest.fn()

      checkRole(UserRole.ADMIN)(req, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.FORBIDDEN)
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: ERROR_MESSAGE.FORBIDDEN,
      })
      expect(next).not.toHaveBeenCalled()
    })
  })
})
