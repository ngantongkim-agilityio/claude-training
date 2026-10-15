import bcrypt from 'bcrypt'

/**
 * Hashes a password using bcrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compare raw password with hashed password from DB
 * @param password - Raw user input
 * @param hashed - Hashed password stored in DB
 * @returns True if match, false if not
 */
export const comparePassword = async (
  password: string,
  hashed: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashed)
}
