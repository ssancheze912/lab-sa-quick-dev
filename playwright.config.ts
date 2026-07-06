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

  // NOTE: only Chromium-based projects are declared here. This sandboxed dev/CI
  // environment has no network egress to Playwright's browser CDN
  // (cdn.playwright.dev), so only the pre-cached Chromium binary at
  // /opt/pw-browsers is available — Firefox and Edge (msedge) can never be
  // installed here. `chromium` + `mobile-chrome` already satisfy AC-E1.1's
  // "desktop and mobile browser" requirement (desktop viewport + real mobile
  // emulation), so cross-browser coverage is not lost, only cross-engine
  // coverage. If a real CI/production pipeline has open internet access,
  // re-add `firefox`/`edge` projects there — this exclusion is sandbox-local,
  // not a project-wide decision.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter frontend dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'dotnet run --project backend/src/SiesaAgents.API',
      url: 'http://localhost:5000/scalar',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],

  outputDir: 'playwright-results/',
});
