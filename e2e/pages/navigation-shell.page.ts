import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Navigation Shell (_app.tsx layout).
 * Covers both desktop (NavigationRail) and mobile (NavigationBar) variants.
 *
 * Story 1.2 — Frontend Navigation Shell
 */
export class NavigationShellPage {
  readonly page: Page;

  // Navigation containers
  readonly navContainer: Locator;
  readonly navigationRail: Locator;
  readonly navigationBar: Locator;

  // Navigation items (desktop rail)
  readonly railItemClientes: Locator;
  readonly railItemContactos: Locator;

  // Navigation items (mobile bar)
  readonly barItemClientes: Locator;
  readonly barItemContactos: Locator;

  // Content area
  readonly appRoot: Locator;
  readonly clientesPage: Locator;
  readonly contactosPage: Locator;

  // 404 / not-found view
  readonly notFoundHeading: Locator;
  readonly notFoundBackLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navContainer = page.getByRole('navigation', {
      name: 'Navegación principal',
    });

    this.navigationRail = page.getByTestId('navigation-rail');
    this.navigationBar = page.getByTestId('navigation-bar');

    this.railItemClientes = page
      .getByTestId('navigation-rail')
      .getByRole('link', { name: /clientes/i });

    this.railItemContactos = page
      .getByTestId('navigation-rail')
      .getByRole('link', { name: /contactos/i });

    this.barItemClientes = page
      .getByTestId('navigation-bar')
      .getByRole('link', { name: /clientes/i });

    this.barItemContactos = page
      .getByTestId('navigation-bar')
      .getByRole('link', { name: /contactos/i });

    this.appRoot = page.getByTestId('app-root');
    this.clientesPage = page.getByTestId('clientes-page');
    this.contactosPage = page.getByTestId('contactos-page');

    this.notFoundHeading = page.getByRole('heading', {
      name: /página no encontrada/i,
    });
    this.notFoundBackLink = page.getByRole('link', { name: /ir a clientes/i });
  }

  async gotoRoot() {
    await this.page.goto('/');
  }

  async gotoClientes() {
    await this.page.goto('/clientes');
    await this.page.waitForURL('**/clientes');
  }

  async gotoContactos() {
    await this.page.goto('/contactos');
    await this.page.waitForURL('**/contactos');
  }

  async gotoUnknownRoute() {
    await this.page.goto('/unknown-route-xyz');
  }
}
