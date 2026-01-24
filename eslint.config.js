// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import convexPlugin from '@convex-dev/eslint-plugin'
import pluginRouter from '@tanstack/eslint-plugin-router'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [
  // Project-specific ignores (must come first)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.vinxi/**',
      '**/.output/**',
      '**/convex/_generated/**',
      '**/*.gen.ts',
      '*.config.js',
      '*.config.ts',
    ],
  },

  // TanStack base config (TypeScript, imports, etc.)
  ...tanstackConfig,

  // TanStack Router rules for route files
  ...pluginRouter.configs['flat/recommended'],

  // TanStack Query rules
  ...pluginQuery.configs['flat/recommended'],

  // Convex rules - only apply to convex/ directory
  {
    files: ['convex/**/*.ts'],
    ...convexPlugin.configs.recommended[0],
  },

  // Convex-specific overrides (actions don't always need await)
  {
    files: ['convex/**/*.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Allow redirect throws (TanStack Router pattern)
  {
    rules: {
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allowThrowingAny: false,
          allowThrowingUnknown: false,
          allow: [{ from: 'package', name: 'Redirect', package: '@tanstack/react-router' }],
        },
      ],
    },
  },
]
