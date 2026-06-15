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

  // Story 2.2 — detail panel locators
  readonly detailNotFound: Locator;
  readonly detailErrorPanel: Locator;
  readonly btnVolverALaLista: Locator;
  readonly detailNombre: Locator;
  readonly detailNit: Locator;
  readonly detailTelefono: Locator;
  readonly detailCiudad: Locator;

  // List-state panels (Story 2.1 additions)
  readonly errorPanel: Locator;
  readonly emptyStatePanel: Locator;
  readonly searchEmptyPanel: Locator;
  readonly btnReintentar: Locator;

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

  // Story 2.4 — Edit cliente
  readonly btnEditarCliente: Locator;
  readonly toastUpdateSuccess: Locator;
  readonly formErrorNombre: Locator;
  readonly formErrorNit: Locator;
  readonly formErrorTelefono: Locator;
  readonly formErrorCiudad: Locator;

  // Story 2.5 — Delete cliente
  readonly btnEliminarCliente: Locator;
  readonly deleteDialog: Locator;
  readonly btnConfirmarEliminarTestid: Locator;
  readonly btnCancelarEliminarTestid: Locator;
  readonly toastDeleteSuccess: Locator;
  readonly toastDeleteOrphan: Locator;
  readonly toastDeleteNotFound: Locator;
  readonly toastDeleteError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navLinkClientes = page.getByRole('link', { name: /clientes/i });

    this.listPanel = page.getByTestId('clientes-list-panel');
    this.searchInput = page.getByPlaceholder(/buscar cliente/i);
    this.clienteItems = page.getByTestId('cliente-list-item');
    this.btnNuevoCliente = page.getByRole('button', { name: /nuevo cliente/i });

    this.detailPanel = page.getByTestId('cliente-detail-panel');

    // Story 2.2 — detail panel locators
    this.detailNotFound = page.getByTestId('cliente-not-found');
    this.detailErrorPanel = page.getByTestId('cliente-detail-error');
    this.btnVolverALaLista = page.getByRole('button', { name: /volver a la lista/i });
    this.detailNombre = page.getByTestId('cliente-detail-nombre');
    this.detailNit = page.getByTestId('cliente-detail-nit');
    this.detailTelefono = page.getByTestId('cliente-detail-telefono');
    this.detailCiudad = page.getByTestId('cliente-detail-ciudad');

    // Story 2.1 — list-state panels
    this.errorPanel = page.getByTestId('clientes-error-panel');
    this.emptyStatePanel = page.getByTestId('clientes-empty-state');
    this.searchEmptyPanel = page.getByTestId('clientes-search-empty');
    this.btnReintentar = page.getByRole('button', { name: /reintentar/i });

    this.form = page.getByRole('dialog');
    this.inputNombre = page.getByLabel(/nombre/i);
    this.inputNit = page.getByLabel(/nit/i);
    this.inputTelefono = page.getByLabel(/teléfono/i);
    this.inputCiudad = page.getByLabel(/ciudad/i);
    this.btnGuardar = page.getByRole('button', { name: /guardar/i });
    this.btnCancelar = page.getByRole('button', { name: /cancelar/i });

    // Story 2.5 — Delete cliente. testid-based locators avoid the ambiguity
    // introduced by having both an `Eliminar` trigger and a `Confirmar`
    // button inside the confirmation dialog. The legacy `btnEliminar` /
    // `btnConfirmarEliminar` aliases point at the new testid locators to
    // keep any existing references compiling.
    this.btnEliminarCliente = page.getByTestId('btn-eliminar-cliente');
    this.deleteDialog = page.getByTestId('cliente-delete-dialog');
    this.btnConfirmarEliminarTestid = page.getByTestId('btn-confirmar-eliminar');
    this.btnCancelarEliminarTestid = page.getByTestId('btn-cancelar-eliminar');
    this.toastDeleteSuccess = page.getByText('Cliente eliminado correctamente');
    this.toastDeleteOrphan = page.getByText('Sus contactos asociados quedaron sin cliente asignado.');
    this.toastDeleteNotFound = page.getByText('Cliente no encontrado. La lista se actualizó.');
    this.toastDeleteError = page.getByText('No se pudo eliminar. Intenta de nuevo.');

    this.btnEliminar = this.btnEliminarCliente;
    this.btnConfirmarEliminar = this.btnConfirmarEliminarTestid;

    // Story 2.4 — Edit cliente
    this.btnEditarCliente = page.getByTestId('btn-editar-cliente');
    this.toastUpdateSuccess = page.getByText('Cliente actualizado correctamente');
    this.formErrorNombre = page.getByTestId('cliente-form-error-nombre');
    this.formErrorNit = page.getByTestId('cliente-form-error-nit');
    this.formErrorTelefono = page.getByTestId('cliente-form-error-telefono');
    this.formErrorCiudad = page.getByTestId('cliente-form-error-ciudad');
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
}
