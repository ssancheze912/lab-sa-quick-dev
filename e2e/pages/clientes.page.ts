import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Clientes section.
 * Mirrors the split-panel layout: list (280px left) + detail (right).
 */
export class ClientesPage {
  readonly page: Page;

  // Navigation
  readonly navLinkClientes: Locator;

  // List panel
  readonly listPanel: Locator;
  readonly searchInput: Locator;
  readonly clienteItems: Locator;
  readonly btnNuevoCliente: Locator;

  // Detail panel
  readonly detailPanel: Locator;
  readonly emptyState: Locator;

  // Sort control (Story 2.6)
  readonly sortControl: Locator;

  // ContactManager locators (Story 4.1)
  readonly contactManagerContainer: Locator;
  readonly contactManagerRows: Locator;
  readonly btnAgregarContacto: Locator;

  // Form (dialog/drawer)
  readonly form: Locator;
  readonly inputNombre: Locator;
  readonly inputNit: Locator;
  readonly inputTelefono: Locator;
  readonly inputCiudad: Locator;
  readonly btnGuardar: Locator;
  readonly btnCancelar: Locator;
  readonly btnEliminar: Locator;
  readonly btnConfirmarEliminar: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navLinkClientes = page.getByRole('link', { name: /clientes/i });

    this.listPanel = page.getByTestId('clientes-list-panel');
    this.searchInput = page.getByPlaceholder(/buscar cliente/i);
    this.clienteItems = page.getByTestId('cliente-list-item');
    this.btnNuevoCliente = page.getByRole('button', { name: /nuevo cliente/i });

    this.detailPanel = page.getByTestId('cliente-detail-panel');
    this.emptyState = page.getByTestId('empty-state');

    // Sort control — data-testid="sort-control" on root/trigger element
    this.sortControl = page.getByTestId('sort-control');

    this.form = page.getByRole('dialog');
    this.inputNombre = page.getByLabel(/nombre/i);
    this.inputNit = page.getByLabel(/nit/i);
    this.inputTelefono = page.getByLabel(/teléfono/i);
    this.inputCiudad = page.getByLabel(/ciudad/i);
    this.btnGuardar = page.getByRole('button', { name: /guardar/i });
    this.btnCancelar = page.getByRole('button', { name: /cancelar/i });
    this.btnEliminar = page.getByRole('button', { name: /eliminar/i });
    this.btnConfirmarEliminar = page.getByRole('button', { name: /confirmar/i });
  }

  async goto() {
    await this.page.goto('/clientes');
    await this.page.waitForURL('**/clientes**');
  }

  async abrirFormularioNuevo() {
    await this.btnNuevoCliente.click();
    await expect(this.form).toBeVisible();
  }

  async llenarFormulario(data: {
    nombre?: string;
    nit?: string;
    telefono?: string;
    ciudad?: string;
  }) {
    if (data.nombre) await this.inputNombre.fill(data.nombre);
    if (data.nit) await this.inputNit.fill(data.nit);
    if (data.telefono) await this.inputTelefono.fill(data.telefono);
    if (data.ciudad) await this.inputCiudad.fill(data.ciudad);
  }

  async guardar() {
    await this.btnGuardar.click();
    await expect(this.form).toBeHidden();
  }

  async seleccionarCliente(nombre: string) {
    await this.page
      .getByTestId('cliente-list-item')
      .filter({ hasText: nombre })
      .click();
  }

  async buscar(termino: string) {
    await this.searchInput.fill(termino);
  }

  async limpiarBusqueda() {
    await this.searchInput.clear();
  }

  /**
   * Selects a sort option from the SortControl component.
   * Supports both shadcn/ui Select (click trigger → click option) and native <select>.
   * Uses role-based option locator with i18n-safe Spanish label patterns.
   */
  async seleccionarOrden(option: 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc') {
    const labelMap: Record<string, RegExp> = {
      'nombre-asc': /nombre a→z|nombre a-z/i,
      'nombre-desc': /nombre z→a|nombre z-a/i,
      'fecha-desc': /más reciente/i,
      'fecha-asc': /más antiguo/i,
    };

    await this.sortControl.click();
    await this.page.getByRole('option', { name: labelMap[option] }).click();
  }
}
