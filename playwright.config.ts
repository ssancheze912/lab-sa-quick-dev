import { defineConfig, devices } from '@playwright/test'

const FRONTEND_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173'
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd frontend && pnpm run dev',
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
})

export { FRONTEND_URL, API_BASE_URL }
