import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the NavigationShell component.
 * Covers both desktop (NavigationRail) and mobile (NavigationBar) variants.
 *
 * Story 1.2: Frontend Navigation Shell
 */
export class NavigationShellPage {
  readonly page: Page;

  // Desktop — NavigationRail
  readonly navigationRail: Locator;
  readonly navRailItemClientes: Locator;
  readonly navRailItemContactos: Locator;

  // Mobile — NavigationBar
  readonly navigationBar: Locator;
  readonly navBarItemClientes: Locator;
  readonly navBarItemContactos: Locator;

  // Route views
  readonly clientesPlaceholderView: Locator;
  readonly contactosPlaceholderView: Locator;

  // 404 view
  readonly notFoundView: Locator;
  readonly notFoundBackLink: Locator;

  // App root (from Story 1.1)
  readonly appRoot: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navigationRail = page.getByTestId('navigation-rail');
    this.navRailItemClientes = page.getByTestId('nav-rail-item-clientes');
    this.navRailItemContactos = page.getByTestId('nav-rail-item-contactos');

    this.navigationBar = page.getByTestId('navigation-bar');
    this.navBarItemClientes = page.getByTestId('nav-bar-item-clientes');
    this.navBarItemContactos = page.getByTestId('nav-bar-item-contactos');

    this.clientesPlaceholderView = page.getByTestId('clientes-placeholder-view');
    this.contactosPlaceholderView = page.getByTestId('contactos-placeholder-view');

    this.notFoundView = page.getByTestId('not-found-view');
    this.notFoundBackLink = page.getByTestId('not-found-back-link');

    this.appRoot = page.getByTestId('app-root');
  }

  async gotoDesktop(path: string) {
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoMobile(path: string) {
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickClientesDesktop() {
    const navPromise = this.page.waitForURL('**/clientes');
    await this.navRailItemClientes.click();
    await navPromise;
  }

  async clickContactosDesktop() {
    const navPromise = this.page.waitForURL('**/contactos');
    await this.navRailItemContactos.click();
    await navPromise;
  }

  async clickClientesMobile() {
    const navPromise = this.page.waitForURL('**/clientes');
    await this.navBarItemClientes.click();
    await navPromise;
  }

  async clickContactosMobile() {
    const navPromise = this.page.waitForURL('**/contactos');
    await this.navBarItemContactos.click();
    await navPromise;
  }
}
