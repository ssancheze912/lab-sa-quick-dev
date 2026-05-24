import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Application Navigation Shell (Story 1.2)
 * Provides typed accessors for NavigationRail and NavigationBar elements.
 */
export class NavigationPage {
  readonly page: Page;

  // Navigation containers
  readonly navigationRail: Locator;
  readonly navigationBar: Locator;
  readonly navigationLandmark: Locator;

  // Navigation items (shared between rail and bar)
  readonly navItemClientes: Locator;
  readonly navItemContactos: Locator;

  // Route views
  readonly clientesView: Locator;
  readonly contactosView: Locator;

  // 404 Not-Found view
  readonly notFoundView: Locator;
  readonly notFoundMessage: Locator;
  readonly notFoundReturnLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navigationRail = page.locator('[data-testid="navigation-rail"]');
    this.navigationBar = page.locator('[data-testid="navigation-bar"]');
    this.navigationLandmark = page.locator('nav[aria-label="Navegación principal"]');

    this.navItemClientes = page.locator('[data-testid="nav-item-clientes"]');
    this.navItemContactos = page.locator('[data-testid="nav-item-contactos"]');

    this.clientesView = page.locator('[data-testid="clientes-view"]');
    this.contactosView = page.locator('[data-testid="contactos-view"]');

    this.notFoundView = page.locator('[data-testid="not-found-view"]');
    this.notFoundMessage = page.locator('[data-testid="not-found-message"]');
    this.notFoundReturnLink = page.locator('[data-testid="not-found-return-link"]');
  }

  async gotoClientes() {
    await this.page.goto('/clientes');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoContactos() {
    await this.page.goto('/contactos');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoUnknownRoute() {
    await this.page.goto('/unknown-path');
    await this.page.waitForLoadState('networkidle');
  }

  async clickNavClientes() {
    await this.navItemClientes.click();
    await this.page.waitForURL('/clientes');
  }

  async clickNavContactos() {
    await this.navItemContactos.click();
    await this.page.waitForURL('/contactos');
  }
}
