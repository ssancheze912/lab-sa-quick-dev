import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Navigation Shell.
 * Encapsulates locators and methods for the persistent navigation structure.
 */
export class NavigationPage {
  readonly page: Page;

  // Top navbar
  readonly navbar: Locator;

  // Desktop left rail
  readonly navigationRail: Locator;

  // Mobile bottom bar
  readonly navigationBar: Locator;

  // Nav items
  readonly navItemClientes: Locator;
  readonly navItemContactos: Locator;

  // 404 view
  readonly notFoundPage: Locator;
  readonly notFoundBackLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.getByTestId('navbar');
    this.navigationRail = page.getByTestId('navigation-rail');
    this.navigationBar = page.getByTestId('navigation-bar');
    this.navItemClientes = page.getByTestId('nav-item-clientes').first();
    this.navItemContactos = page.getByTestId('nav-item-contactos').first();
    this.notFoundPage = page.getByTestId('not-found-page');
    this.notFoundBackLink = page.getByTestId('not-found-back-link');
  }

  /** Navigate to a given path and wait for network idle */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /** Click Clientes nav item (rail — desktop) */
  async clickClientes(): Promise<void> {
    await this.navItemClientes.click();
    await this.page.waitForURL('**/clientes');
  }

  /** Click Contactos nav item (rail — desktop) */
  async clickContactos(): Promise<void> {
    await this.navItemContactos.click();
    await this.page.waitForURL('**/contactos');
  }

  /** Tap Clientes item (mobile NavigationBar) */
  async tapClientes(): Promise<void> {
    const mobileItem = this.navigationBar.getByTestId('nav-item-clientes');
    await mobileItem.tap();
    await this.page.waitForURL('**/clientes');
  }

  /** Tap Contactos item (mobile NavigationBar) */
  async tapContactos(): Promise<void> {
    const mobileItem = this.navigationBar.getByTestId('nav-item-contactos');
    await mobileItem.tap();
    await this.page.waitForURL('**/contactos');
  }

  /** Assert Clientes item has aria-current="page" */
  async expectClientesActive(): Promise<void> {
    await expect(this.navItemClientes).toHaveAttribute('aria-current', 'page');
  }

  /** Assert Contactos item has aria-current="page" */
  async expectContactosActive(): Promise<void> {
    await expect(this.navItemContactos).toHaveAttribute('aria-current', 'page');
  }

  /** Assert Navbar is visible with correct product name */
  async expectNavbarVisible(productName = 'Siesa Agents'): Promise<void> {
    await expect(this.navbar).toBeVisible();
    await expect(this.navbar).toContainText(productName);
  }

  /** Assert desktop layout: NavigationRail visible, NavigationBar hidden */
  async expectDesktopLayout(): Promise<void> {
    await expect(this.navigationRail).toBeVisible();
    await expect(this.navigationBar).not.toBeVisible();
  }

  /** Assert mobile layout: NavigationBar visible, NavigationRail hidden */
  async expectMobileLayout(): Promise<void> {
    await expect(this.navigationBar).toBeVisible();
    await expect(this.navigationRail).not.toBeVisible();
  }
}
