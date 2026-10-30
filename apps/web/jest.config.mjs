import nextJest from "next/jest.js"

// next/jest compiles with SWC and loads next.config, matching the app build
const createJestConfig = nextJest({ dir: "./" })

const config = {
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  clearMocks: true,
}

export default createJestConfig(config)
