import { defineConfig, devices } from '@playwright/test';

/**
 * Siesa Agents CRM - Playwright E2E Configuration
 * Frontend: React + Vite (http://localhost:5173)
 * Backend:  .NET 10 Minimal API (http://localhost:5000)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-CO',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      // Backend — .NET 10 Minimal API on http://localhost:5000.
      // Readiness gated on /health endpoint (returns 200 once the API is up).
      command: 'dotnet run --project backend/src/SiesaAgents.API --no-launch-profile --urls http://localhost:5000',
      url: 'http://localhost:5000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Frontend — Vite dev server on http://localhost:5173.
      // Uses --filter so pnpm-workspace.yaml routes the command to frontend/.
      command: 'pnpm --filter frontend dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],

  outputDir: 'playwright-results/',
});
