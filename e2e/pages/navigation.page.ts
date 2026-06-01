import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Navigation Shell.
 * Covers desktop NavigationRail and mobile NavigationBar from siesa-ui-kit.
 * Story 1.2 — Frontend Navigation Shell
 */
export class NavigationPage {
  readonly page: Page;

  // --- Desktop NavigationRail (visible at lg: ≥ 1024px) ---
  readonly navigationRail: Locator;
  readonly navRailClientes: Locator;
  readonly navRailContactos: Locator;

  // --- Mobile NavigationBar (visible below lg: < 1024px) ---
  readonly navigationBar: Locator;
  readonly navBarClientes: Locator;
  readonly navBarContactos: Locator;

  // --- Shared: active item indicator ---
  readonly activeNavItem: Locator;

  // --- Not Found view ---
  readonly notFoundView: Locator;
  readonly notFoundHeading: Locator;
  readonly notFoundBackLink: Locator;

  // --- Placeholder views ---
  readonly clientesPlaceholder: Locator;
  readonly contactosPlaceholder: Locator;

  constructor(page: Page) {
    this.page = page;

    // navigation-rail and navigation-bar testids are set on the wrapper elements in __root.tsx
    this.navigationRail = page.getByTestId('navigation-rail');
    // siesa-ui-kit NavigationRail's r8 item renderer emits data-item-id (not data-testid)
    // Use locator('[data-item-id]') for individual rail item selection
    this.navRailClientes = page.locator('[data-item-id="clientes"]');
    this.navRailContactos = page.locator('[data-item-id="contactos"]');

    this.navigationBar = page.getByTestId('navigation-bar');
    // siesa-ui-kit NavigationBar: items are located by their label text within the nav bar
    this.navBarClientes = page.getByTestId('navigation-bar').getByText('Clientes');
    this.navBarContactos = page.getByTestId('navigation-bar').getByText('Contactos');

    // siesa-ui-kit uses aria-current="page" for active navigation items (not data-active)
    this.activeNavItem = page.locator('[aria-current="page"]');

    this.notFoundView = page.getByTestId('not-found-view');
    this.notFoundHeading = page.getByTestId('not-found-heading');
    this.notFoundBackLink = page.getByTestId('not-found-back-link');

    this.clientesPlaceholder = page.getByTestId('clientes-placeholder');
    this.contactosPlaceholder = page.getByTestId('contactos-placeholder');
  }

  async gotoClientes() {
    await this.page.goto('/clientes');
    await this.page.waitForURL('**/clientes**');
  }

  async gotoContactos() {
    await this.page.goto('/contactos');
    await this.page.waitForURL('**/contactos**');
  }

  async gotoUnknownRoute() {
    await this.page.goto('/unknown-route-that-does-not-exist');
  }

  async clickNavRailClientes() {
    await this.navRailClientes.click();
    await this.page.waitForURL('**/clientes**');
  }

  async clickNavRailContactos() {
    await this.navRailContactos.click();
    await this.page.waitForURL('**/contactos**');
  }

  async clickNavBarClientes() {
    await this.navBarClientes.click();
    await this.page.waitForURL('**/clientes**');
  }

  async clickNavBarContactos() {
    await this.navBarContactos.click();
    await this.page.waitForURL('**/contactos**');
  }
}
