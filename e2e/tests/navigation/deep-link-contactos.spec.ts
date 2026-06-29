/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD E2E Tests — RED Phase
 * Verifies that deep-linking directly to /contactos renders the Contactos
 * placeholder view without any redirect or blank screen.
 *
 * Acceptance Criteria covered:
 *   AC #3 — Deep link to /contactos renders the correct view (FR30)
 *
 * Test case:
 *   TC-E1-P1-03  Deep linking — direct URL access to /contactos
 */

import { test, expect } from '@playwright/test'

test.describe('Deep link — /contactos (Story 1.2 / AC #3 / TC-E1-P1-03)', () => {
  test('renders the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: a user types http://localhost:5173/contactos into the URL bar
    // (Network-first: register response listener BEFORE navigating)
    const contactosResponse = page.waitForResponse(
      (resp) => resp.url().endsWith('/contactos') && resp.status() === 200,
    )

    // WHEN: the browser navigates to /contactos
    await page.goto('/contactos')
    await contactosResponse

    // THEN: the Contactos heading is visible (placeholder route mounted)
    await expect(page.getByRole('heading', { name: 'Contactos' })).toBeVisible()
  })

  test('does NOT redirect to / (root) when deep-linking to /contactos', async ({ page }) => {
    // GIVEN: deep link to /contactos
    await page.goto('/contactos')
    await page.waitForLoadState('networkidle')

    // THEN: the final URL is still /contactos (no SPA redirect away)
    await expect(page).toHaveURL(/\/contactos$/)
  })

  test('shows the shell navigation (rail OR bar) alongside the Contactos view', async ({ page }) => {
    // GIVEN: deep link to /contactos
    await page.goto('/contactos')

    // WHEN/THEN: at least one of the shell navigation surfaces is visible.
    const rail = page.getByTestId('navigation-rail')
    const bar = page.getByTestId('navigation-bar')
    await expect(rail.or(bar).first()).toBeVisible()
  })
})
