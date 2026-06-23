import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Navigation Shell (Story 1.2).
 * Provides typed accessors for NavigationRail (desktop) and NavigationBar (mobile).
 */
export class NavigationPage {
  readonly page: Page;

  // Desktop NavigationRail (visible at >= 1024px)
  readonly navigationRail: Locator;

  // Mobile NavigationBar (visible at < 1024px)
  readonly navigationBar: Locator;

  // Nav items (shared between rail and bar)
  readonly navItemClientes: Locator;
  readonly navItemContactos: Locator;

  // Route pages
  readonly clientesPage: Locator;
  readonly contactosPage: Locator;

  // 404 not-found page
  readonly notFoundPage: Locator;
  readonly notFoundMessage: Locator;
  readonly notFoundBackLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navigationRail = page.getByTestId('navigation-rail');
    this.navigationBar = page.getByTestId('navigation-bar');

    this.navItemClientes = page.getByTestId('nav-item-clientes');
    this.navItemContactos = page.getByTestId('nav-item-contactos');

    this.clientesPage = page.getByTestId('clientes-page');
    this.contactosPage = page.getByTestId('contactos-page');

    this.notFoundPage = page.getByTestId('not-found-page');
    this.notFoundMessage = page.getByTestId('not-found-message');
    this.notFoundBackLink = page.getByTestId('not-found-back-link');
  }

  /** Navigate to /clientes and wait for route */
  async gotoClientes() {
    await this.page.goto('/clientes');
    await this.page.waitForURL('**/clientes');
  }

  /** Navigate to /contactos and wait for route */
  async gotoContactos() {
    await this.page.goto('/contactos');
    await this.page.waitForURL('**/contactos');
  }

  /** Click Clientes nav item and wait for SPA navigation */
  async clickClientes() {
    await this.navItemClientes.click();
    await this.page.waitForURL('**/clientes');
  }

  /** Click Contactos nav item and wait for SPA navigation */
  async clickContactos() {
    await this.navItemContactos.click();
    await this.page.waitForURL('**/contactos');
  }

  /** Returns true if the nav item is marked as active */
  async isClientesActive(): Promise<boolean> {
    const attr = await this.navItemClientes.getAttribute('data-active');
    return attr === 'true';
  }

  /** Returns true if the nav item is marked as active */
  async isContactosActive(): Promise<boolean> {
    const attr = await this.navItemContactos.getAttribute('data-active');
    return attr === 'true';
  }

  /** Inject a window marker to detect SPA navigation (survives client-side nav, not full reloads) */
  async injectSpaMarker() {
    await this.page.evaluate(() => {
      (window as Record<string, unknown>).__spaNavigationMarker = true;
    });
  }

  /** Returns true if the SPA marker still exists (no full reload occurred) */
  async spaMarkerExists(): Promise<boolean> {
    return this.page.evaluate(() => {
      return (window as Record<string, unknown>).__spaNavigationMarker === true;
    });
  }
}
