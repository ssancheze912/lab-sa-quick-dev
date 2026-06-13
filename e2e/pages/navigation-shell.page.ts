import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Navigation Shell.
 * Encapsulates selectors for NavigationRail (desktop) and NavigationBar (mobile).
 * Story 1.2: Frontend Navigation Shell
 */
export class NavigationShellPage {
  readonly page: Page;

  // NavigationRail (desktop ≥1024px)
  readonly navigationRail: Locator;
  readonly navItemClientes: Locator;
  readonly navItemContactos: Locator;

  // NavigationBar (mobile <1024px)
  readonly navigationBar: Locator;
  readonly navBarItemClientes: Locator;
  readonly navBarItemContactos: Locator;

  // Page content
  readonly clientesPageHeading: Locator;
  readonly contactosPageHeading: Locator;

  // 404 page
  readonly notFoundPage: Locator;
  readonly notFoundLinkClientes: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navigationRail = page.getByTestId('navigation-rail');
    this.navItemClientes = page.getByTestId('nav-item-clientes');
    this.navItemContactos = page.getByTestId('nav-item-contactos');

    this.navigationBar = page.getByTestId('navigation-bar');
    this.navBarItemClientes = page.getByTestId('nav-bar-item-clientes');
    this.navBarItemContactos = page.getByTestId('nav-bar-item-contactos');

    this.clientesPageHeading = page.getByTestId('clientes-page-heading');
    this.contactosPageHeading = page.getByTestId('contactos-page-heading');

    this.notFoundPage = page.getByTestId('not-found-page');
    this.notFoundLinkClientes = page.getByTestId('not-found-link-clientes');
  }

  async gotoClientes() {
    await this.page.goto('/clientes');
    await this.page.waitForURL('**/clientes');
  }

  async gotoContactos() {
    await this.page.goto('/contactos');
    await this.page.waitForURL('**/contactos');
  }

  async gotoRoot() {
    await this.page.goto('/');
  }

  async gotoUnknown(path = '/unknown') {
    await this.page.goto(path);
  }
}
