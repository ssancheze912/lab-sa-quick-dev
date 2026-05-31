import { test, expect } from '@playwright/test';
import { NavigationPage } from '../../pages/navigation.page';

// ────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail + Navbar visible (5 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC1 — Desktop: NavigationRail + Navbar visible', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the Navbar with productName "Siesa Agents" on desktop', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.expectNavbarVisible('Siesa Agents');
  });

  test('should display the NavigationRail on the left side on desktop', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationRail).toBeVisible();
  });

  test('should show "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationRail.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should show "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationRail.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should NOT display the NavigationBar (mobile bottom nav) on desktop', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationBar).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC2 — NavigationRail: Clientes navigates client-side (3 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC2 — NavigationRail: Clientes navigates client-side', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /clientes on clicking Clientes without a full page reload', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');
    await nav.clickClientes();
    await expect(page).toHaveURL(/.*\/clientes/);
  });

  test('should mark the "Clientes" item as active (aria-current="page") after navigation', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.expectClientesActive();
  });

  test('should NOT mark "Contactos" as active when on /clientes route', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navItemContactos).not.toHaveAttribute('aria-current', 'page');
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC3 — NavigationRail: Contactos navigates client-side (3 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC3 — NavigationRail: Contactos navigates client-side', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos on clicking Contactos without a full page reload', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.clickContactos();
    await expect(page).toHaveURL(/.*\/contactos/);
  });

  test('should mark the "Contactos" item as active (aria-current="page") after navigation', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');
    await nav.expectContactosActive();
  });

  test('should NOT mark "Clientes" as active when on /contactos route', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');
    await expect(nav.navItemClientes).not.toHaveAttribute('aria-current', 'page');
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC4 — Mobile: NavigationBar (bottom nav) (6 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC4 — Mobile: NavigationBar (bottom nav)', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('should display NavigationBar (bottom nav) on mobile viewport', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationBar).toBeVisible();
  });

  test('should NOT display the NavigationRail on mobile viewport', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationRail).not.toBeVisible();
  });

  test('should show "Clientes" item accessible in NavigationBar on mobile', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationBar.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should show "Contactos" item accessible in NavigationBar on mobile', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navigationBar.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should have minimum 44px touch targets for NavigationBar items (WCAG 2.1 AA, FR29)', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    const clientesItem = nav.navigationBar.getByTestId('nav-item-clientes');
    const box = await clientesItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should navigate to /contactos on tapping Contactos in NavigationBar on mobile', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.tapContactos();
    await expect(page).toHaveURL(/.*\/contactos/);
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC5 — Deep link /clientes (3 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC5 — Deep link /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view on direct URL /clientes without any redirect', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page).toHaveURL(/.*\/clientes/);
  });

  test('should show the navigation shell when loading /clientes via direct URL', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.expectNavbarVisible();
  });

  test('should render the Clientes placeholder content at /clientes', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-page')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC6 — Deep link /contactos (3 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC6 — Deep link /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view on direct URL /contactos without any redirect', async ({ page }) => {
    await page.goto('/contactos');
    await expect(page).toHaveURL(/.*\/contactos/);
  });

  test('should show the navigation shell when loading /contactos via direct URL', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');
    await nav.expectNavbarVisible();
  });

  test('should render the Contactos placeholder content at /contactos', async ({ page }) => {
    await page.goto('/contactos');
    await expect(page.getByTestId('contactos-page')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC7 — Unknown route: 404 view (4 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC7 — Unknown route: 404 view', () => {
  test('should render a 404 not-found view for an unknown route', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });

  test('should display the 404 message in Spanish: "Página no encontrada"', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    await expect(page.getByText('Página no encontrada')).toBeVisible();
  });

  test('should display a link to return to the home section from the 404 view', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    const link = page.getByTestId('not-found-back-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Volver a Clientes');
  });

  test('should navigate to /clientes when clicking the return link from 404 view', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    await page.getByTestId('not-found-back-link').click();
    await expect(page).toHaveURL(/.*\/clientes/);
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC8 — Root / redirects to /clientes (2 tests)
// ────────────────────────────────────────────────────────────────────────
test.describe('AC8 — Root / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically on page load', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/clientes/);
  });

  test('should render the Clientes view (not a blank page) after redirect from /', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('clientes-page')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// WCAG Accessibility (1 test)
// ────────────────────────────────────────────────────────────────────────
test.describe('WCAG Accessibility', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have ARIA labels in Spanish on navigation items', async ({ page }) => {
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await expect(nav.navItemClientes).toHaveAttribute('aria-label', 'Ir a Clientes');
    await expect(nav.navItemContactos).toHaveAttribute('aria-label', 'Ir a Contactos');
  });
});
