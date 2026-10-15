import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
  },
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': [
        'warn',
        {
          printWidth: 80,
        },
      ],
    },
  },
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/*.js',
      '**/*.mjs',
    ],
  },
)
