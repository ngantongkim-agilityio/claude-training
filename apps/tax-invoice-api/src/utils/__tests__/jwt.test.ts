import jwt from 'jsonwebtoken'

// Utils
import { generateToken } from '@/utils'

// Types
import { UserRole } from '@/types'

jest.mock('jsonwebtoken')

describe('JWT Utils', () => {
  const payload = {
    email: 'test@example.com',
    role: UserRole.USER,
  }

  it('should generate a signed JWT token with correct payload', () => {
    const mockSign = jwt.sign as jest.Mock
    mockSign.mockReturnValue('mocked.token.value')

    const token = generateToken(payload)

    expect(mockSign).toHaveBeenCalledWith(payload, expect.any(String), {
      expiresIn: '7d',
    })
    expect(token).toBe('mocked.token.value')
  })
})
