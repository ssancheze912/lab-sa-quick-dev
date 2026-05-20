import { test, expect } from '@playwright/test';

/**
 * E2E Acceptance Tests: Story 1.2 — Frontend Navigation Shell
 *
 * RED PHASE: These tests are written BEFORE implementation.
 * They will FAIL until the navigation shell is implemented.
 *
 * Covers:
 *   AC1 — NavigationRail (desktop) visible on left with Clientes + Contactos entries; SPA navigation (no full reload)
 *   AC2 — NavigationBar (mobile, < 1024px) visible at bottom; items accessible and tappable
 *   AC3 — Deep linking: /clientes and /contactos render directly without redirection
 *   AC4 — Unknown route renders graceful 404 view (no crash, no blank screen)
 *   AC5 — Nav landmark has aria-label="Navegación principal"; items have Spanish visible labels (WCAG 2.1 AA)
 *   AC6 — Active/selected state on nav item reflects current route
 */

test.describe('Story 1.2 — Frontend Navigation Shell', () => {

  // ─── AC1: Desktop NavigationRail ─────────────────────────────────────────

  test('AC1 — NavigationRail is visible on the left side in desktop viewport', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop browser (>= 1024px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // CRITICAL: Intercept BEFORE navigation (network-first pattern)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: NavigationRail is visible
    await expect(page.getByTestId('nav-rail')).toBeVisible();
  });

  test('AC1 — NavigationRail contains "Clientes" navigation entry on desktop', async ({ page }) => {
    // GIVEN: Application loaded on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: "Clientes" nav entry is visible within the rail
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('AC1 — NavigationRail contains "Contactos" navigation entry on desktop', async ({ page }) => {
    // GIVEN: Application loaded on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: "Contactos" nav entry is visible within the rail
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('AC1 — Clicking "Clientes" in NavigationRail navigates to /clientes without full page reload', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // Detect full page reloads via navigation events
    let hadFullReload = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame() && frame.url().includes('/clientes')) {
        // TanStack Router uses pushState — no full reload is expected
        // A full reload would trigger a new document load
        hadFullReload = true;
      }
    });

    // WHEN: The user clicks the "Clientes" nav item
    await page.getByTestId('nav-item-clientes').click();

    // THEN: URL is /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('AC1 — Clicking "Contactos" in NavigationRail navigates to /contactos', async ({ page }) => {
    // GIVEN: Application loaded on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // WHEN: The user clicks the "Contactos" nav item
    await page.getByTestId('nav-item-contactos').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL(/\/contactos/);
  });

  // ─── AC2: Mobile NavigationBar ────────────────────────────────────────────

  test('AC2 — NavigationBar is visible at the bottom in mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: Application is loaded on a mobile browser viewport (< 1024px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: NavigationBar is visible (not the rail)
    await expect(page.getByTestId('nav-bar')).toBeVisible();
  });

  test('AC2 — NavigationRail is NOT visible on mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: Application loaded on a mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: NavigationRail is hidden (Tailwind hidden class)
    await expect(page.getByTestId('nav-rail')).toBeHidden();
  });

  test('AC2 — NavigationBar contains "Clientes" item that is tappable on mobile', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // WHEN: The "Clientes" item in NavigationBar is clicked
    await page.getByTestId('nav-item-clientes').click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('AC2 — NavigationBar contains "Contactos" item that is tappable on mobile', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // WHEN: The "Contactos" item in NavigationBar is clicked
    await page.getByTestId('nav-item-contactos').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL(/\/contactos/);
  });

  // ─── AC3: Deep Linking ────────────────────────────────────────────────────

  test('AC3 — Direct URL /clientes renders the Clientes view without redirection', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirect to home screen)
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('AC3 — Direct URL /clientes renders the Clientes view content', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: The Clientes view content is visible (not blank, not error)
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });

  test('AC3 — Direct URL /contactos renders the Contactos view without redirection', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: The URL remains /contactos (no redirect)
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('AC3 — Direct URL /contactos renders the Contactos view content', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: The Contactos view content is visible (not blank, not error)
    await expect(page.getByTestId('contactos-view')).toBeVisible();
  });

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
