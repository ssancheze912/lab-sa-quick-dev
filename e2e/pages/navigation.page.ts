import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Application Navigation Shell.
 * Covers NavigationRail (desktop) and NavigationBar (mobile) from siesa-ui-kit.
 * Used by Story 1.1 (CORS/backend health) and Story 1.2 (navigation shell) ATDD tests.
 */
export class NavigationShellPage {
  readonly navigationRail: Locator;
  readonly navigationBar: Locator;
  readonly clientesLink: Locator;
  readonly contactosLink: Locator;

  constructor(private readonly page: Page) {
    // siesa-ui-kit NavigationRail — desktop
    this.navigationRail = page.getByTestId('navigation-rail');
    // siesa-ui-kit NavigationBar — mobile
    this.navigationBar = page.getByTestId('navigation-bar');

    this.clientesLink = page.getByRole('link', { name: /clientes/i });
    this.contactosLink = page.getByRole('link', { name: /contactos/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async gotoClientes() {
    await this.page.goto('/clientes');
  }

  async gotoContactos() {
    await this.page.goto('/contactos');
  }
}
