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
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /**
   * Two webServers so `playwright test` can bring up the full stack it needs:
   *   - Vite dev server for the React app (http://localhost:5173)
   *   - .NET 10 Minimal API for the deep-link / CRUD data setup (http://localhost:5000)
   *
   * `reuseExistingServer` lets a developer keep long-running processes attached
   * across runs; CI always starts fresh. The backend must be up before the tests
   * call `apiHelper.createCliente()` from `e2e/helpers/api.helper.ts` — otherwise
   * Playwright fails with `ECONNREFUSED 127.0.0.1:5000`.
   */
  webServer: [
    {
      command: 'pnpm --filter frontend dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'dotnet run --project backend/src/SiesaAgents.API --urls http://localhost:5000',
      url: 'http://localhost:5000/api/v1/clientes',
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
    },
  ],

  outputDir: 'playwright-results/',
});
