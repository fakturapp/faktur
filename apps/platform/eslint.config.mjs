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
    // UI library copied from apps/frontend — keep the same lint posture
    // as the main app (which intentionally allows setState in effects for
    // legacy patterns and uses `any` in a handful of helpers).
    'src/components/ui/**',
    'src/lib/dev-mode.ts',
    'src/lib/icon.tsx',
  ]),
  {
    rules: {
      // Many legacy effect-driven loaders in api-keys pages call setState
      // synchronously. Suspending those rewrites for now — runtime is fine.
      'react-hooks/set-state-in-effect': 'off',
      // We use `any` deliberately in a few API response shapes to keep
      // the surface flexible while it stabilises.
      '@typescript-eslint/no-explicit-any': 'off',
      // Trailing-only warnings — keep as warnings, not errors.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
])

export default eslintConfig
