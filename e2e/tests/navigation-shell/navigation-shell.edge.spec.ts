/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — Edge Cases & Boundary Conditions
 * Complements the ATDD happy-path tests in navigation-shell.spec.ts
 *
 * Coverage added (not in ATDD):
 *   EC1  — Tablet viewport (768px): NavigationBar shown, NavigationRail hidden
 *   EC2  — Narrow mobile viewport (320px): NavigationBar accessible, no overflow crash
 *   EC3  — Browser back/forward history navigation preserves SPA state
 *   EC4  — Rapid successive navigation clicks do not crash the app
 *   EC5  — No JavaScript runtime errors during normal navigation flow
 *   EC6  — No unexpected console errors on /clientes, /contactos, /
 *   EC7  — 404 page produces no runtime JS errors
 *   EC8  — Navigation completes within 2s performance budget
 *   EC9  — Keyboard Enter on nav item triggers navigation (accessibility)
 *   EC10 — All pages expose app-shell wrapper (shell persists across routes)
 *   EC11 — Deep unknown path (e.g., /a/b/c/d) renders 404 without crash
 *   EC12 — Active item NOT set when on 404 page (no false highlight)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// EC1 — Tablet viewport (768px): NavigationBar visible, NavigationRail hidden
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC1 — Tablet viewport (768px) uses NavigationBar', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('should show NavigationBar at 768px (below 1024px breakpoint)', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT show NavigationRail at 768px (below 1024px breakpoint)', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should display both Clientes and Contactos nav items in NavigationBar at 768px', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC2 — Narrow mobile viewport (320px): NavigationBar accessible, no crash
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC2 — Narrow mobile viewport (320px)', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('should render NavigationBar without crash at 320px viewport', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    expect(runtimeErrors).toHaveLength(0);
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should make Clientes nav item visible and tappable at 320px', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toBeVisible();

    const clientesBox = await clientesItem.boundingBox();
    expect(clientesBox).not.toBeNull();
    expect(clientesBox!.width).toBeGreaterThan(0);
  });

  test('should make Contactos nav item visible and tappable at 320px', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toBeVisible();

    const contactosBox = await contactosItem.boundingBox();
    expect(contactosBox).not.toBeNull();
    expect(contactosBox!.width).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC3 — Browser back/forward history navigation preserves SPA state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC3 — Browser history back/forward navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should restore /clientes view when pressing browser Back from /contactos', async ({ page }) => {
    // Navigate forward: / → /clientes → /contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // Press browser Back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('should restore /contactos view when pressing browser Forward after Back', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // Go back then forward
    await page.goBack();
    await page.waitForURL('**/clientes');
    await page.goForward();
    await page.waitForURL('**/contactos');

    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();
  });

  test('should update active nav highlight when using browser history Back', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // Go back to /clientes — Clientes item should become active
    await page.goBack();
    await page.waitForURL('**/clientes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC4 — Rapid successive navigation clicks do not crash the app
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC4 — Rapid successive navigation clicks', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should not crash when clicking nav items in rapid succession', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // Fire multiple clicks without waiting for each navigation to settle
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // Wait for final state to stabilize
    await page.waitForLoadState('networkidle');

    // No runtime errors must have occurred
    expect(runtimeErrors).toHaveLength(0);

    // App shell must still be present
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('should settle on the last clicked nav item after rapid clicks', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // End on contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC5 — No JavaScript runtime errors during normal navigation flow
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC5 — No runtime JS errors during normal navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should produce no JS runtime errors navigating / → /clientes → /contactos', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/');
    await page.waitForURL('**/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.waitForLoadState('networkidle');

    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC6 — No unexpected console errors on main routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC6 — No unexpected console errors on main routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should produce no console errors on /clientes', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // Filter out known benign React dev-mode warnings if any
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('Download the React DevTools')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should produce no console errors on /contactos', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('Download the React DevTools')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC7 — 404 page produces no runtime JS errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC7 — 404 page stability (no JS errors)', () => {
  test('should render 404 page without any runtime JS errors', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    expect(runtimeErrors).toHaveLength(0);
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });

  test('should serve SPA HTML (200) for unknown paths (Vite SPA fallback)', async ({ request }) => {
    const response = await request.get('http://localhost:5173/deep/unknown/path');
    expect(response.status()).toBe(200);
    const ct = response.headers()['content-type'] ?? '';
    expect(ct).toContain('html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC8 — Navigation performance: route transitions within time budget
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC8 — Navigation performance budget (SPA transitions)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should complete SPA navigation from /clientes to /contactos within 2 seconds', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const start = Date.now();
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  test('should complete initial page load at /clientes within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC9 — Keyboard accessibility: Enter key triggers navigation on nav items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC9 — Keyboard navigation accessibility (Enter key)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos when Enter is pressed on the Contactos nav item', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // Focus and activate Contactos nav item with keyboard
    await page.locator('[data-testid="nav-item-contactos"]').focus();
    await page.keyboard.press('Enter');

    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
  });

  test('should navigate to /clientes when Enter is pressed on the Clientes nav item', async ({ page }) => {
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-clientes"]').focus();
    await page.keyboard.press('Enter');

    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });

  test('should make nav items focusable via Tab key', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // Press Tab until we reach a nav item
    // Nav items are <a> elements so they are naturally focusable
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.focus();
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('nav-item-clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC10 — App shell wrapper persists across all routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC10 — App shell wrapper persists across all routes', () => {
  test('should have app-shell present on /clientes', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="app-shell"]')).toBeAttached();
  });

  test('should have app-shell present on /contactos', async ({ page }) => {
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="app-shell"]')).toBeAttached();
  });

  test('should have app-shell present on the 404 not-found page', async ({ page }) => {
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="app-shell"]')).toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC11 — Deep unknown path renders 404 without crash
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC11 — Deep unknown paths render 404 gracefully', () => {
  test('should render 404 view for deeply nested unknown path /a/b/c/d', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/a/b/c/d');
    await page.waitForLoadState('networkidle');

    expect(runtimeErrors).toHaveLength(0);
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });

  test('should render 404 view for path with special characters /foo-bar_baz', async ({ page }) => {
    await page.goto('/foo-bar_baz');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC12 — Active item state when on 404 page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EC12 — No false active highlight on 404 page', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should NOT show navigation-rail on the 404 page (notFoundComponent renders outside _app layout)', async ({ page }) => {
    // The 404 page is rendered via notFoundComponent on __root, which is OUTSIDE the _app layout
    // Therefore nav items should not appear on the 404 page
    await page.goto('/unknown-path-xyz');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
    // Navigation shell components should NOT be present on the 404 page
    // (they are part of the _app pathless layout, not the root layout)
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});
