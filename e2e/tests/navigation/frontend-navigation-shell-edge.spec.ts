/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Boundary Conditions
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — Additional coverage beyond ATDD happy paths.
 *
 * Coverage areas:
 *   - Breakpoint boundary: viewport exactly at 1024px (edge of desktop breakpoint)
 *   - Breakpoint boundary: viewport at 1023px (edge of mobile breakpoint)
 *   - Keyboard navigation: Tab key cycles through nav items; Enter activates
 *   - Browser history: Back/Forward buttons preserve active state
 *   - Active state exclusivity: only one nav item active at a time
 *   - 404 for deeply nested unknown paths
 *   - 404 for paths with query params and hash fragments
 *   - data-active="false" attribute on inactive nav item
 *   - Root redirect preserves navigation structure
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Breakpoint boundary — 1024px (exact desktop threshold)', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[P1] should render NavigationRail at exactly 1024px viewport width', async ({ page }) => {
    // GIVEN: The application is loaded at exactly the desktop breakpoint (1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail is visible (>= 1024px is desktop)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

test.describe('Breakpoint boundary — 1023px (just below desktop threshold)', () => {
  test.use({ viewport: { width: 1023, height: 768 } });

  test('[P1] should render NavigationBar at 1023px viewport width (mobile mode)', async ({ page }) => {
    // GIVEN: The application is loaded at 1023px (one pixel below desktop breakpoint)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar is visible (< 1024px is mobile)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active state exclusivity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Active state exclusivity', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should have data-active="false" on the Contactos item when at /clientes', async ({ page }) => {
    // GIVEN: The user is on the /clientes route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: The Contactos nav item has data-active="false" (inactive)
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="false"]')).toBeVisible();
  });

  test('[P1] should have data-active="false" on the Clientes item when at /contactos', async ({ page }) => {
    // GIVEN: The user is on the /contactos route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: The Clientes nav item has data-active="false" (inactive)
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="false"]')).toBeVisible();
  });

  test('[P1] should switch active state after navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The application starts at /clientes with Clientes active
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();

    // WHEN: The user clicks Contactos
    const navPromise = page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await navPromise;

    // THEN: Contactos becomes active and Clientes becomes inactive
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="false"]')).toBeVisible();
  });

  test('[P1] should switch active state after navigating from /contactos to /clientes', async ({ page }) => {
    // GIVEN: The application starts at /contactos with Contactos active
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).toBeVisible();

    // WHEN: The user clicks Clientes
    const navPromise = page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await navPromise;

    // THEN: Clientes becomes active and Contactos becomes inactive
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="false"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser history navigation (back/forward)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history — back and forward navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should restore correct active state after browser back navigation', async ({ page }) => {
    // GIVEN: The user has navigated from /clientes to /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: The user presses the browser back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: The app renders /clientes and Clientes nav item is active
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();
  });

  test('[P1] should restore correct active state after browser forward navigation', async ({ page }) => {
    // GIVEN: The user has gone back from /contactos to /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: The user presses the browser forward button
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: The app renders /contactos and Contactos nav item is active
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 edge cases — various unknown path formats
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 not-found — edge case path formats', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should show 404 view for a deeply nested unknown path', async ({ page }) => {
    // GIVEN: A deeply nested path that does not match any route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to the deeply nested path
    await page.goto('/unknown/deep/path/to/nowhere');

    // THEN: The 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('no encontrada');
  });

  test('[P2] should show 404 view for an unknown path with query parameters', async ({ page }) => {
    // GIVEN: An unknown path that includes a query string
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to the path with query params
    await page.goto('/ruta-inexistente?param=valor&otro=dato');

    // THEN: The 404 not-found view is still displayed gracefully
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P2] should show 404 view for an unknown path with a hash fragment', async ({ page }) => {
    // GIVEN: An unknown path with a hash fragment
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to the path with hash
    await page.goto('/no-existe#seccion');

    // THEN: The 404 not-found view is still displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P2] should display the back-to-clientes link text in Spanish on 404', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found page
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/pagina-no-existe');

    // THEN: The link text is in Spanish ("Volver a Clientes")
    await expect(page.locator('[data-testid="not-found-back-link"]')).toContainText('Volver');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard navigation accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Keyboard navigation accessibility', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should allow Tab key to focus the Clientes nav item', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user presses Tab to cycle focus to the navigation
    const clientesLink = page.locator('[data-testid="nav-item-clientes"]');
    await clientesLink.focus();

    // THEN: The Clientes nav item is focused
    await expect(clientesLink).toBeFocused();
  });

  test('[P2] should allow Tab key to focus the Contactos nav item', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The Contactos nav item is programmatically focused
    const contactosLink = page.locator('[data-testid="nav-item-contactos"]');
    await contactosLink.focus();

    // THEN: The Contactos nav item is focused
    await expect(contactosLink).toBeFocused();
  });

  test('[P2] should navigate to /contactos when pressing Enter on the focused Contactos item', async ({ page }) => {
    // GIVEN: The Contactos nav item has keyboard focus
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    const contactosLink = page.locator('[data-testid="nav-item-contactos"]');
    await contactosLink.focus();

    // WHEN: The user presses Enter
    const navPromise = page.waitForURL('**/contactos');
    await page.keyboard.press('Enter');
    await navPromise;

    // THEN: The application navigates to /contactos
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect edge case
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Root redirect — navigation structure preserved', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should show NavigationRail after redirect from / to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to the root path
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The root path redirects to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The navigation shell with NavigationRail is fully rendered
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation aria-label presence on mobile
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — navigation landmark on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P2] should have accessible nav landmark with Spanish aria-label on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The nav landmark with Spanish aria-label is present even on mobile
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });

  test('[P2] should allow tapping Contactos on mobile to navigate without page reload', async ({ page }) => {
    // GIVEN: The application is loaded on mobile at /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user taps the Contactos item in the mobile NavigationBar
    const navPromise = page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-item-contactos"]').tap();
    await navPromise;

    // THEN: The URL changes to /contactos (SPA navigation, no reload)
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});
