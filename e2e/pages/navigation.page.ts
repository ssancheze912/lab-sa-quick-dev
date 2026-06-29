import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the persistent Navigation Shell.
 * Covers both NavigationRail (desktop >= 1024px) and NavigationBar (mobile < 1024px).
 * Story 1.2: Frontend Navigation Shell
 */
export class NavigationPage {
  readonly page: Page;

  // Desktop: NavigationRail (visible on lg+ viewports)
  readonly navigationRail: Locator;

  // Mobile: NavigationBar (visible on < lg viewports)
  readonly navigationBar: Locator;

  // Shared nav items (present in both rail and bar)
  readonly navItemClientes: Locator;
  readonly navItemContactos: Locator;

  // 404 Not-found view elements
  readonly notFoundView: Locator;
  readonly notFoundMessage: Locator;
  readonly notFoundBackLink: Locator;

  // Route views (placeholder containers)
  readonly clientesView: Locator;
  readonly contactosView: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navigationRail = page.getByTestId('navigation-rail');
    this.navigationBar = page.getByTestId('navigation-bar');

    this.navItemClientes = page.getByTestId('nav-item-clientes');
    this.navItemContactos = page.getByTestId('nav-item-contactos');

    this.notFoundView = page.getByTestId('not-found-view');
    this.notFoundMessage = page.getByTestId('not-found-message');
    this.notFoundBackLink = page.getByTestId('not-found-back-link');

    this.clientesView = page.getByTestId('clientes-view');
    this.contactosView = page.getByTestId('contactos-view');
  }

  async gotoClientes() {
    await this.page.goto('/clientes');
    await this.page.waitForURL('**/clientes**');
  }

  async gotoContactos() {
    await this.page.goto('/contactos');
    await this.page.waitForURL('**/contactos**');
  }

  async gotoRoot() {
    await this.page.goto('/');
  }

  async gotoUnknownRoute(path = '/ruta-desconocida') {
    await this.page.goto(path);
  }

  async clickNavClientes() {
    await this.navItemClientes.click();
    await this.page.waitForURL('**/clientes**');
  }

  async clickNavContactos() {
    await this.navItemContactos.click();
    await this.page.waitForURL('**/contactos**');
  }

  async isClientesActive(): Promise<boolean> {
    const attr = await this.navItemClientes.getAttribute('data-active');
    return attr === 'true';
  }

  async isContactosActive(): Promise<boolean> {
    const attr = await this.navItemContactos.getAttribute('data-active');
    return attr === 'true';
  }
}
