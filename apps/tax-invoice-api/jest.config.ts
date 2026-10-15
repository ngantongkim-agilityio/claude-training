import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coveragePathIgnorePatterns: ['app.ts', 'src/types', 'src/configs'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}

export default config
