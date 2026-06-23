/**
 * Story 1.2: Frontend Navigation Shell — Edge Case Expansion
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE EXPANSION — testarch-automate (BMad-Integrated Mode)
 * Expands ATDD coverage with boundary conditions, error paths, and
 * structural invariants NOT covered in the RED-phase ATDD tests.
 *
 * Acceptance Criteria targeted (edge cases):
 *   AC1 — Viewport boundary at exactly 1024px, NavigationRail vs NavigationBar
 *   AC2 — Tablet viewport (768px), touch navigation, mobile layout invariants
 *   AC5 — 404 for multiple unknown routes (not just /desconocido)
 *   AC6 — Root redirect preserves Clientes nav active state
 *   AC7 — Rapid sequential navigation, browser history back/forward
 *   AC8 — Active state after browser back button
 *   AC9 — Space key activates nav items; Tab order starts in navigation area
 *   AC10 — No runtime errors on rapid navigation cycle
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge — Viewport boundary conditions at 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge — Viewport boundary at exactly 1024px', () => {
  test('[P1] should show NavigationRail (not NavigationBar) at exactly 1024px width', async ({ page }) => {
    // GIVEN: Viewport is set exactly at the lg breakpoint threshold (1024px)
    await page.setViewportSize({ width: 1024, height: 768 });

    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: NavigationRail is visible (>= 1024px shows rail) and NavigationBar is hidden
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });

  test('[P1] should show NavigationBar (not NavigationRail) at 1023px width', async ({ page }) => {
    // GIVEN: Viewport is 1px below the lg breakpoint threshold
    await page.setViewportSize({ width: 1023, height: 768 });

    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: NavigationBar is visible (< 1024px shows bar) and NavigationRail is hidden
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 edge — Tablet viewport (768px) and touch navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge — Tablet viewport (768px) navigation', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('[P1] should show NavigationBar on tablet viewport (768px < 1024px)', async ({ page }) => {
    // GIVEN: Tablet viewport — 768px is less than the 1024px breakpoint
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: NavigationBar is shown (not NavigationRail)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P1] should have both nav items accessible on tablet viewport', async ({ page }) => {
    // GIVEN: Tablet viewport
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: Both Clientes and Contactos items are accessible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('[P1] should navigate client-side to /contactos on tablet viewport', async ({ page }) => {
    // GIVEN: User is on /clientes on a tablet
    await page.goto('/clientes');

    // Inject SPA marker
    await page.evaluate(() => {
      (window as Record<string, unknown>).__spaMarker = true;
    });

    // WHEN: User taps Contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: SPA navigation occurred (no full reload)
    const markerExists = await page.evaluate(() => {
      return (window as Record<string, unknown>).__spaMarker === true;
    });
    expect(markerExists).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 edge — Multiple unknown routes, all show 404 in Spanish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge — Multiple unknown routes all show 404', () => {
  const unknownRoutes = [
    '/pagina-desconocida',
    '/admin',
    '/clientes/999/no-existe',
    '/../../etc/passwd',
  ];

  for (const route of unknownRoutes) {
    test(`[P1] should show 404 not-found page for "${route}"`, async ({ page }) => {
      // GIVEN: The user navigates to an unknown route
      // WHEN: The page loads
      await page.goto(route);

      // THEN: The not-found page is displayed
      await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
    });
  }

  test('[P1] should show 404 without triggering JavaScript runtime errors', async ({ page }) => {
    // GIVEN: A sequence of unknown routes — none should throw
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/completely-unknown-route-xyz');

    // THEN: No unhandled JS errors on the 404 page
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should have not-found message that contains at least one Spanish keyword', async ({ page }) => {
    // GIVEN: AC5 requires message in Spanish
    // WHEN: Unknown route is loaded
    await page.goto('/ruta-desconocida-edge');

    // THEN: Message contains common Spanish "not found" phrases
    const notFoundMessage = page.locator('[data-testid="not-found-message"]');
    await expect(notFoundMessage).toBeVisible();
    const text = await notFoundMessage.innerText();
    const spanishKeywords = ['no', 'encontr', 'página', 'existe', 'volver', 'error', '404'];
    const hasSpanishContent = spanishKeywords.some((kw) =>
      text.toLowerCase().includes(kw)
    );
    expect(hasSpanishContent, `404 message should contain Spanish content, got: "${text}"`).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 edge — 404 back link navigates to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge — 404 back link behavior', () => {
  test('[P1] should navigate to /clientes when clicking the back link from 404 page', async ({ page }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/ruta-que-no-existe');
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();

    // WHEN: User clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: User navigates to /clientes
    await page.waitForURL('**/clientes');
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P1] should navigate to /clientes from 404 without a full page reload', async ({ page }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/ruta-no-conocida-abc');
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();

    // Inject SPA marker
    await page.evaluate(() => {
      (window as Record<string, unknown>).__spaMarker = true;
    });

    // WHEN: User clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();
    await page.waitForURL('**/clientes');

    // THEN: No full page reload occurred
    const markerExists = await page.evaluate(() => {
      return (window as Record<string, unknown>).__spaMarker === true;
    });
    expect(markerExists).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 edge — Root redirect active state and no blank screen
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 edge — Root redirect active state consistency', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should show Clientes nav item as active after redirecting from /', async ({ page }) => {
    // GIVEN: User navigates to root /
    // WHEN: App redirects to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Clientes nav item is active (redirect preserves correct active state)
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should NOT show Contactos nav item as active after redirect from /', async ({ page }) => {
    // GIVEN: User navigates to root / which redirects to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Contactos is NOT active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 edge — Browser history back/forward navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 edge — Browser history navigation (back/forward)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should navigate back to /clientes using browser back button', async ({ page }) => {
    // GIVEN: User navigates /clientes → /contactos
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: User presses the browser back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: URL is back to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P1] should update active nav state after browser back navigation', async ({ page }) => {
    // GIVEN: User navigated /clientes → /contactos → back
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: User presses back
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: Clientes nav item should be active again
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('data-active', 'true');
  });

  test('[P1] should navigate forward to /contactos using browser forward button', async ({ page }) => {
    // GIVEN: User went /clientes → /contactos → back to /clientes
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: User presses forward
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: URL is /contactos
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('[P1] should update active nav state after browser forward navigation', async ({ page }) => {
    // GIVEN: User went /clientes → /contactos → back → forward
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: Contactos nav item is active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 edge — Clicking the currently active nav item (same-route navigation)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 edge — Clicking active nav item (same-route navigation)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should NOT cause a full page reload when clicking the already-active nav item', async ({ page }) => {
    // GIVEN: User is on /clientes (Clientes is already active)
    await page.goto('/clientes');

    // Inject SPA marker
    await page.evaluate(() => {
      (window as Record<string, unknown>).__spaMarker = true;
    });

    // WHEN: User clicks the already-active Clientes nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: SPA marker survives (no full page reload)
    const markerExists = await page.evaluate(() => {
      return (window as Record<string, unknown>).__spaMarker === true;
    });
    expect(markerExists).toBe(true);
    // URL should still be /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P2] should keep the active nav item active after clicking it again', async ({ page }) => {
    // GIVEN: Clientes is the active item
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');

    // WHEN: Clientes item is clicked again
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: Clientes remains active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 edge — Active state after rapid sequential navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 edge — Active state consistency under rapid navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should settle on Contactos active state after alternating navigation', async ({ page }) => {
    // GIVEN: User performs rapid alternating navigation
    await page.goto('/clientes');

    // WHEN: User alternates between routes
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: The final active state is Contactos
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 edge — Space key activates nav items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 edge — Space key activates navigation items', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should activate navigation item when pressing Space on a focused nav item', async ({ page }) => {
    // GIVEN: Desktop viewport, Clientes nav item is focused while on /contactos
    await page.goto('/contactos');
    await page.locator('[data-testid="nav-item-clientes"]').focus();

    // WHEN: User presses Space (WCAG 2.1 AA requires Space to activate buttons/links)
    await page.keyboard.press('Space');

    // THEN: Navigation occurs to /clientes
    await page.waitForURL('**/clientes');
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P1] should be able to Tab from Clientes to Contactos nav item', async ({ page }) => {
    // GIVEN: Desktop viewport, Clientes nav item is focused
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-clientes"]').focus();

    // WHEN: User presses Tab
    await page.keyboard.press('Tab');

    // THEN: Contactos nav item receives focus (sequential keyboard navigation)
    const focusedTestId = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.getAttribute('data-testid') : null;
    });
    // Contactos should be the next focusable element in the nav
    expect(focusedTestId, 'Tab from Clientes should focus Contactos nav item').toBe('nav-item-contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 edge — Navigation role and aria-label attributes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 edge — ARIA role and landmark requirements', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should have exactly one main landmark on the page', async ({ page }) => {
    // GIVEN: Semantic HTML requires a single <main> per page
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: Exactly one <main> element or role="main" exists
    const mainElements = page.locator('main, [role="main"]');
    const count = await mainElements.count();
    expect(count, 'Page should have exactly one main landmark').toBe(1);
  });

  test('[P1] should have a navigation landmark (nav element or role="navigation")', async ({ page }) => {
    // GIVEN: WCAG 2.1 AA requires navigation to be wrapped in a landmark
    // WHEN: App is loaded at /clientes on desktop
    await page.goto('/clientes');

    // THEN: At least one nav element or role="navigation" is present
    const navLandmarks = page.locator('nav, [role="navigation"]');
    const count = await navLandmarks.count();
    expect(count, 'Page must have at least one navigation landmark').toBeGreaterThanOrEqual(1);
  });

  test('[P1] should have nav items with role="link" or role="button" or be inside <a> tags', async ({ page }) => {
    // GIVEN: WCAG requires interactive elements to have correct semantic roles
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: Clientes nav item is activatable (link or button)
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const tagName = await clientesItem.evaluate((el) => el.tagName.toLowerCase());
    const role = await clientesItem.getAttribute('role');

    const isSemanticInteractive =
      tagName === 'a' ||
      tagName === 'button' ||
      role === 'link' ||
      role === 'button';
    expect(
      isSemanticInteractive,
      `nav-item-clientes must be <a>, <button>, role="link", or role="button" — got tagName="${tagName}", role="${role}"`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC10 edge — No runtime errors during rapid navigation cycle
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC10 edge — No runtime errors under stress navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should produce no runtime errors during 5 rapid sequential navigations', async ({ page }) => {
    // GIVEN: Runtime error monitoring is active
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') runtimeErrors.push(msg.text());
    });

    // WHEN: User performs 5 sequential navigation actions
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: No runtime errors occurred
    expect(runtimeErrors, `Runtime errors during navigation: ${runtimeErrors.join(', ')}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile layout edge — NavigationBar position and content scrollability
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile layout edge — Content scrollability above NavigationBar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P2] should have a main content area that is not obscured by the NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with fixed-bottom NavigationBar
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: Main content area exists and NavigationBar does not fully overlap it
    const mainContent = page.locator('[data-testid="main-content"]');
    await expect(mainContent).toBeVisible();

    const navBar = page.locator('[data-testid="navigation-bar"]');
    await expect(navBar).toBeVisible();

    const mainBox = await mainContent.boundingBox();
    const navBox = await navBar.boundingBox();
    const viewport = page.viewportSize();

    // TODO (TEA Review): Guard removed — elements confirmed visible above, so boundingBox() must be non-null.
    // Unconditional assertions prevent silent assertion skips (flakiness risk).
    expect(mainBox, 'Main content bounding box must be obtainable').not.toBeNull();
    expect(navBox, 'NavigationBar bounding box must be obtainable').not.toBeNull();
    expect(viewport, 'Viewport size must be available').not.toBeNull();
    // Main content should start above where navigation bar begins
    // (not fully hidden behind the nav bar)
    expect(mainBox!.y, 'Main content area should start near the top of viewport').toBeLessThan(navBox!.y);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// File structure invariants — Route files must exist (AC10: TypeScript strict)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC10 edge — Route file structure invariants', () => {
  test('[P1] should have _app.tsx route file for the pathless layout', () => {
    // GIVEN: Architecture defines _app.tsx as the pathless layout route
    // WHEN: The filesystem is inspected
    const appRoutePath = path.join(FRONTEND_DIR, 'src', 'routes', '_app.tsx');

    // THEN: _app.tsx exists
    expect(
      fs.existsSync(appRoutePath),
      `Expected _app.tsx at ${appRoutePath}`
    ).toBe(true);
  });

  test('[P1] should have _app/clientes.tsx route file for the /clientes route', () => {
    // GIVEN: /clientes is a child route of the _app pathless layout
    const clientesPath = path.join(FRONTEND_DIR, 'src', 'routes', '_app', 'clientes.tsx');

    expect(
      fs.existsSync(clientesPath),
      `Expected _app/clientes.tsx at ${clientesPath}`
    ).toBe(true);
  });

  test('[P1] should have _app/contactos.tsx route file for the /contactos route', () => {
    // GIVEN: /contactos is a child route of the _app pathless layout
    const contactosPath = path.join(FRONTEND_DIR, 'src', 'routes', '_app', 'contactos.tsx');

    expect(
      fs.existsSync(contactosPath),
      `Expected _app/contactos.tsx at ${contactosPath}`
    ).toBe(true);
  });

  test('[P1] should have index.tsx with a redirect to /clientes', () => {
    // GIVEN: Root / must redirect to /clientes (AC6)
    const indexPath = path.join(FRONTEND_DIR, 'src', 'routes', 'index.tsx');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: The redirect target is /clientes
    expect(content, 'index.tsx must contain redirect to /clientes').toContain('/clientes');
  });

  test('[P1] should have a 404 not-found route file', () => {
    // GIVEN: AC5 requires a catch-all 404 route
    // TanStack Router uses 404.tsx OR $ catch-all pattern
    const notFoundPath404 = path.join(FRONTEND_DIR, 'src', 'routes', '404.tsx');
    const notFoundPathCatchAll = path.join(FRONTEND_DIR, 'src', 'routes', '$.tsx');
    const notFoundPathNotFound = path.join(FRONTEND_DIR, 'src', 'routes', '_404.tsx');

    const anyExists =
      fs.existsSync(notFoundPath404) ||
      fs.existsSync(notFoundPathCatchAll) ||
      fs.existsSync(notFoundPathNotFound);

    expect(
      anyExists,
      'Expected a 404/catch-all route file (404.tsx, $.tsx, or _404.tsx)'
    ).toBe(true);
  });

  test('[P1] should have __root.tsx with Outlet for child routes', () => {
    // GIVEN: Root layout must render child routes via <Outlet />
    const rootPath = path.join(FRONTEND_DIR, 'src', 'routes', '__root.tsx');
    expect(fs.existsSync(rootPath)).toBe(true);

    const content = fs.readFileSync(rootPath, 'utf-8');

    // THEN: Outlet is imported and used
    expect(content, '__root.tsx must import and render Outlet for child route rendering').toContain('Outlet');
  });

  test('[P2] should have siesa-ui-kit listed in frontend package.json dependencies', () => {
    // GIVEN: AC1 requires NavigationRail and NavigationBar from siesa-ui-kit
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(
      allDeps['siesa-ui-kit'],
      'package.json must declare siesa-ui-kit as a dependency'
    ).toBeTruthy();
  });

  test('[P2] should have @heroicons/react listed in frontend package.json dependencies', () => {
    // GIVEN: Company standards require Heroicons as the icon library
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(
      allDeps['@heroicons/react'],
      'package.json must declare @heroicons/react'
    ).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1/AC2 edge — NavigationRail implementation structure in _app.tsx
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC2 edge — Navigation shell implementation structure', () => {
  test('[P1] should have _app.tsx import siesa-ui-kit navigation components', () => {
    // GIVEN: AC1 mandates NavigationRail from siesa-ui-kit (not a custom component)
    const appRoutePath = path.join(FRONTEND_DIR, 'src', 'routes', '_app.tsx');
    if (!fs.existsSync(appRoutePath)) {
      return; // File existence checked in prior test
    }

    const content = fs.readFileSync(appRoutePath, 'utf-8');

    // THEN: siesa-ui-kit navigation components are imported
    const importsNavigationRail = content.includes('NavigationRail');
    const importsNavigationBar = content.includes('NavigationBar');
    expect(
      importsNavigationRail || content.includes('siesa-ui-kit'),
      '_app.tsx must import NavigationRail from siesa-ui-kit'
    ).toBe(true);
    expect(
      importsNavigationBar || content.includes('siesa-ui-kit'),
      '_app.tsx must import NavigationBar from siesa-ui-kit'
    ).toBe(true);
  });

  test('[P1] should have _app.tsx use TanStack Router Outlet for content rendering', () => {
    // GIVEN: _app.tsx is a layout route — it must render <Outlet /> for child routes
    const appRoutePath = path.join(FRONTEND_DIR, 'src', 'routes', '_app.tsx');
    if (!fs.existsSync(appRoutePath)) {
      return;
    }

    const content = fs.readFileSync(appRoutePath, 'utf-8');

    // THEN: Outlet is used to render child routes
    expect(content, '_app.tsx must import and render Outlet for child route content').toContain('Outlet');
  });

  test('[P2] should have _app.tsx use createFileRoute with /_app path', () => {
    // GIVEN: TanStack Router file-based routing convention for pathless layouts
    const appRoutePath = path.join(FRONTEND_DIR, 'src', 'routes', '_app.tsx');
    if (!fs.existsSync(appRoutePath)) {
      return;
    }

    const content = fs.readFileSync(appRoutePath, 'utf-8');

    // THEN: createFileRoute is used with the /_app route identifier
    expect(content, '_app.tsx must use createFileRoute for TanStack Router integration').toContain('createFileRoute');
    expect(content, "_app.tsx createFileRoute must reference '/_app' path").toContain('/_app');
  });
});
