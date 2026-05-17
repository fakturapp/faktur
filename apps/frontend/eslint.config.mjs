import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/**',
  ]),
  {
    rules: {
      // Legacy patterns inherited from the large dashboard codebase.
      // React 19 / React Compiler strict rules: disable until full refactor.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/component-hook-factories': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/no-create-during-render': 'off',
      'react-hooks/no-access-before-declaration': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      // Empty interface extends (very common pattern in our UI lib).
      '@typescript-eslint/no-empty-object-type': 'off',
      // `any` is used intentionally in API helpers — flexible until shapes stabilise.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/no-unescaped-entities': 'off',
      // Many user-uploaded images (avatars, logos) — next/image not needed.
      '@next/next/no-img-element': 'off',
      // Allow `let` for variables reassigned conditionally (downgrade to warn).
      'prefer-const': 'warn',
    },
  },
])

export default eslintConfig
