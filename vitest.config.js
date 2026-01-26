import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: 'tests/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
})
