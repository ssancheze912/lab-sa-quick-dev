/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD E2E Tests — RED Phase
 * Verifies that deep-linking directly to /clientes renders the Clientes
 * placeholder view without any redirect or blank screen.
 *
 * Acceptance Criteria covered:
 *   AC #3 — Deep link to /clientes (and to /contactos in sibling spec) renders the correct view (FR30)
 *
 * Test case:
 *   TC-E1-P1-02  Deep linking — direct URL access to /clientes
 */

import { test, expect } from '@playwright/test'

test.describe('Deep link — /clientes (Story 1.2 / AC #3 / TC-E1-P1-02)', () => {
  test('renders the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: a user types http://localhost:5173/clientes into the URL bar
    // (Network-first: register response listener BEFORE navigating)
    const clientesResponse = page.waitForResponse(
      (resp) => resp.url().endsWith('/clientes') && resp.status() === 200,
    )

    // WHEN: the browser navigates to /clientes
    await page.goto('/clientes')
    await clientesResponse

    // THEN: the Clientes heading is visible (placeholder route mounted)
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
  })

  test('does NOT redirect to / (root) when deep-linking to /clientes', async ({ page }) => {
    // GIVEN: deep link to /clientes
    // WHEN: the SPA boots
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')

    // THEN: the final URL is still /clientes (no SPA redirect away)
    await expect(page).toHaveURL(/\/clientes$/)
  })

  test('shows the shell navigation (rail OR bar) alongside the Clientes view', async ({ page }) => {
    // GIVEN: deep link to /clientes
    await page.goto('/clientes')

    // WHEN/THEN: at least one of the shell navigation surfaces is visible.
    // We assert one OR the other to remain breakpoint-agnostic at the E2E level.
    const rail = page.getByTestId('navigation-rail')
    const bar = page.getByTestId('navigation-bar')
    await expect(rail.or(bar).first()).toBeVisible()
  })
})
