import { test, expect } from '@playwright/test'

const FRONTEND_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173'
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'

// AC1 — Frontend Vite server initialization
test('AC1 — should serve the frontend app on port 5173 without errors', async ({ page }) => {
  // Given: a clean development machine with Node.js installed
  // When: the developer navigates to the frontend URL
  const response = await page.goto(FRONTEND_URL)

  // Then: the server responds with HTTP 200
  expect(response?.status()).toBe(200)
})

test('AC1 — should render the root HTML document with a valid React mount point', async ({ page }) => {
  // Given: the frontend app is served
  // When: the page loads
  await page.goto(FRONTEND_URL)

  // Then: the root element with data-testid="app-root" is present
  const appRoot = page.locator('[data-testid="app-root"]')
  await expect(appRoot).toBeAttached()
})

test('AC1 — should load without any TypeScript compilation errors visible in the browser console', async ({ page }) => {
  // Given: TypeScript strict mode is enabled
  // When: the app loads
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(FRONTEND_URL)
  await page.waitForLoadState('networkidle')

  // Then: no TypeScript compilation errors in console
  const tsErrors = consoleErrors.filter(
    (e) => e.includes('TypeScript') || e.includes('TS') || e.includes('[plugin:vite]'),
  )
  expect(tsErrors).toHaveLength(0)
})

test('AC1 — should not have any JavaScript runtime errors on initial load', async ({ page }) => {
  // Given: the frontend app is initialized
  // When: the page loads
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => {
    runtimeErrors.push(error.message)
  })

  await page.goto(FRONTEND_URL)
  await page.waitForLoadState('networkidle')

  // Then: no JavaScript runtime errors
  expect(runtimeErrors).toHaveLength(0)
})

// AC3 — CORS configuration
test('AC3 — should allow frontend to reach backend health endpoint without CORS errors', async ({ page }) => {
  // Given: both servers are running
  // When: the frontend makes a request to the backend
  const corsErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
      corsErrors.push(msg.text())
    }
  })

  await page.goto(FRONTEND_URL)

  // Attempt a fetch to the backend from the frontend origin
  await page.evaluate(async (apiUrl) => {
    try {
      await fetch(`${apiUrl}/scalar`, { method: 'GET' })
    } catch {
      // Connection errors are acceptable here; we only care about CORS errors
    }
  }, API_BASE_URL)

  // Then: no CORS errors in browser console
  expect(corsErrors).toHaveLength(0)
})

test('AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking', async ({
  request,
}) => {
  // Given: the backend server is running
  // When: the frontend origin makes a request to /scalar
  const response = await request.get(`${API_BASE_URL}/scalar`, {
    headers: {
      Origin: FRONTEND_URL,
    },
    failOnStatusCode: false,
  })

  // Then: response is not a CORS error (200, 301, or 302 acceptable)
  expect([200, 301, 302]).toContain(response.status())
})

// AC4 — TypeScript strict mode
test('AC4 — should load the frontend without Vite TypeScript error overlay', async ({ page }) => {
  // Given: TypeScript compiler strict mode is enabled
  // When: the page loads
  await page.goto(FRONTEND_URL)
  await page.waitForLoadState('networkidle')

  // Then: no Vite error overlay is present
  const errorOverlay = page.locator('vite-error-overlay')
  await expect(errorOverlay).toHaveCount(0)
})
