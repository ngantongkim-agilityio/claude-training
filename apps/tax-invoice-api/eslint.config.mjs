import nodeConfig from '@repo/eslint-config/node'
import jestPlugin from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  ...nodeConfig,
  {
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
  {
    ignores: [
      'commitlint.config.ts',
      'jest.config.ts',
    ],
  },
]
