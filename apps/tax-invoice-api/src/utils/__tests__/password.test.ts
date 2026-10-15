import bcrypt from 'bcrypt'

// Utils
import { hashPassword, comparePassword } from '@/utils'

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should generate a hash different from the plain password', async () => {
      const password = 'mySecret123!'
      const hashed = await hashPassword(password)

      expect(typeof hashed).toBe('string')
      expect(hashed).not.toBe(password)
      // Check that hash matches bcrypt pattern
      expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/)
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'anotherSecret!'
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(password, salt)
      const isMatch = await comparePassword(password, hash)

      expect(isMatch).toBe(true)
    })

    it('should return false for non-matching password and hash', async () => {
      const password = 'passwordOne'
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash('passwordTwo', salt)
      const isMatch = await comparePassword(password, hash)

      expect(isMatch).toBe(false)
    })
  })
})
