import { test, expect } from '@playwright/test';

/**
 * E2E Acceptance Tests: Story 1.2 — Frontend Navigation Shell (Part 2)
 *
 * Covers:
 *   AC4 — Unknown route renders graceful 404 view (no crash, no blank screen)
 *   AC5 — Nav landmark has aria-label="Navegación principal"; items have Spanish visible labels (WCAG 2.1 AA)
 *   AC6 — Active/selected state on nav item reflects current route
 *   Index redirect — / redirects to /clientes
 *
 * See navigation-shell.spec.ts for AC1, AC2, AC3.
 */

test.describe('Story 1.2 — Frontend Navigation Shell (AC4–AC6)', () => {

  // ─── AC4: 404 Not-Found Route ─────────────────────────────────────────────

  test('AC4 — Unknown route /unknown renders a graceful 404 view (no crash)', async ({ page }) => {
    // GIVEN: A user navigates to a route that does not exist
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /unknown
    await page.goto('/unknown');

    // THEN: A 404 view is displayed, no crash, no blank screen
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  test('AC4 — 404 view does not show a blank screen', async ({ page }) => {
    // GIVEN: Navigation to an unknown route
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Page loads at non-existent route
    await page.goto('/ruta-que-no-existe');

    // THEN: The body has content (not empty/blank)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('AC4 — 404 view contains a link back to /clientes', async ({ page }) => {
    // GIVEN: User lands on a 404 page
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/unknown');

    // THEN: There is a link that navigates back to /clientes
    const backLink = page.getByTestId('not-found-back-link');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/clientes/);
  });

  // ─── AC5: Accessibility (WCAG 2.1 AA) ────────────────────────────────────

  test('AC5 — Nav landmark has aria-label="Navegación principal"', async ({ page }) => {
    // GIVEN: The navigation is rendered on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/');

    // THEN: A nav element with aria-label="Navegación principal" exists
    await expect(
      page.locator('nav[aria-label="Navegación principal"]').first()
    ).toBeAttached();
  });

  test('AC5 — "Clientes" nav item has visible Spanish label text', async ({ page }) => {
    // GIVEN: The navigation is rendered
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The app loads
    await page.goto('/');

    // THEN: "Clientes" label is visible (Spanish, not english "Clients")
    await expect(page.getByTestId('nav-item-clientes')).toContainText('Clientes');
  });

  test('AC5 — "Contactos" nav item has visible Spanish label text', async ({ page }) => {
    // GIVEN: The navigation is rendered
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The app loads
    await page.goto('/');

    // THEN: "Contactos" label is visible (Spanish)
    await expect(page.getByTestId('nav-item-contactos')).toContainText('Contactos');
  });

  // ─── AC6: Active/Selected State ───────────────────────────────────────────

  test('AC6 — "Clientes" nav item appears in active/selected state when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Navigation renders on /clientes
    await page.goto('/clientes');

    // THEN: The "Clientes" item has the active marker attribute
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
  });

  test('AC6 — "Contactos" nav item is NOT in active state when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Navigation renders on /clientes
    await page.goto('/clientes');

    // THEN: The "Contactos" item does NOT have the active marker
    await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
  });

  test('AC6 — "Contactos" nav item appears in active/selected state when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Navigation renders on /contactos
    await page.goto('/contactos');

    // THEN: The "Contactos" item has the active marker attribute
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
  });

  test('AC6 — "Clientes" nav item is NOT in active state when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Navigation renders on /contactos
    await page.goto('/contactos');

    // THEN: The "Clientes" item does NOT have the active marker
    await expect(page.getByTestId('nav-item-clientes')).not.toHaveAttribute('data-active', 'true');
  });

  // ─── Index Redirect ───────────────────────────────────────────────────────

  test('Index / redirects to /clientes', async ({ page }) => {
    // GIVEN: The root URL is visited
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /
    await page.goto('/');

    // THEN: Redirected to /clientes automatically
    await expect(page).toHaveURL(/\/clientes/);
  });
});
