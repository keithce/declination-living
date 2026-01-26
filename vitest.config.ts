import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [viteTsConfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.output'],
  },
})
