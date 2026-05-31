import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Navigation Shell (Story 1.2).
 * Covers: Navbar, NavigationRail (desktop), NavigationBar (mobile).
 */
export class NavigationPage {
  readonly page: Page;

  // Navbar (top bar — always visible)
  readonly navbar: Locator;

  // NavigationRail (desktop ≥ 1024px — left side)
  readonly navigationRail: Locator;

  // NavigationBar (mobile < 1024px — bottom)
  readonly navigationBar: Locator;

  // Navigation items (shared between rail and bar via data-testid)
  readonly navItemClientes: Locator;
  readonly navItemContactos: Locator;

  // 404 Not Found
  readonly notFoundPage: Locator;
  readonly notFoundBackLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navbar = page.getByTestId('navbar');
    this.navigationRail = page.getByTestId('navigation-rail');
    this.navigationBar = page.getByTestId('navigation-bar');

    this.navItemClientes = page.getByTestId('nav-item-clientes');
    this.navItemContactos = page.getByTestId('nav-item-contactos');

    this.notFoundPage = page.getByTestId('not-found-page');
    this.notFoundBackLink = page.getByTestId('not-found-back-link');
  }

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async clickClientes() {
    await this.navItemClientes.click();
    await this.page.waitForURL('**/clientes**');
  }

  async clickContactos() {
    await this.navItemContactos.click();
    await this.page.waitForURL('**/contactos**');
  }

  async tapClientes() {
    await this.navItemClientes.tap();
    await this.page.waitForURL('**/clientes**');
  }

  async tapContactos() {
    await this.navItemContactos.tap();
    await this.page.waitForURL('**/contactos**');
  }

  async expectClientesActive() {
    await expect(this.navItemClientes).toHaveAttribute('aria-current', 'page');
  }

  async expectContactosActive() {
    await expect(this.navItemContactos).toHaveAttribute('aria-current', 'page');
  }

  async expectNavbarVisible() {
    await expect(this.navbar).toBeVisible();
    await expect(this.navbar).toContainText('Siesa Agents');
  }

  async expectDesktopLayout() {
    await expect(this.navigationRail).toBeVisible();
    await expect(this.navigationBar).toBeHidden();
  }

  async expectMobileLayout() {
    await expect(this.navigationBar).toBeVisible();
    await expect(this.navigationRail).toBeHidden();
  }
}
