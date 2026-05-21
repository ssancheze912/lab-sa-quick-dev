import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Contactos section.
 * Mirrors the standalone table layout with search and detail panel.
 */
export class ContactosPage {
  readonly page: Page;

  // Navigation
  readonly navLinkContactos: Locator;

  // List
  readonly searchInput: Locator;
  readonly contactoRows: Locator;
  readonly btnNuevoContacto: Locator;
  readonly filtroSinCliente: Locator;

  // Form (dialog/drawer)
  readonly form: Locator;
  readonly inputNombre: Locator;
  readonly inputEmail: Locator;
  readonly inputCargo: Locator;
  readonly inputTelefono: Locator;
  readonly btnGuardar: Locator;
  readonly btnCancelar: Locator;
  readonly btnEliminar: Locator;
  readonly btnConfirmarEliminar: Locator;

  // Detail
  readonly detailPanel: Locator;
  readonly clienteAsociadoLink: Locator;
  readonly sinClienteAsignado: Locator;
  readonly btnVolver: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navLinkContactos = page.getByRole('link', { name: /contactos/i });

    this.searchInput = page.getByPlaceholder(/buscar contacto/i);
    this.contactoRows = page.getByTestId('contacto-row');
    this.btnNuevoContacto = page.getByRole('button', { name: /nuevo contacto/i });
    this.filtroSinCliente = page.getByRole('checkbox', { name: /sin cliente/i });

    this.form = page.getByRole('dialog');
    this.inputNombre = page.getByLabel(/nombre/i);
    this.inputEmail = page.getByLabel(/email/i);
    this.inputCargo = page.getByLabel(/cargo/i);
    this.inputTelefono = page.getByLabel(/teléfono/i);
    this.btnGuardar = page.getByRole('button', { name: /guardar/i });
    this.btnCancelar = page.getByRole('button', { name: /cancelar/i });
    this.btnEliminar = page.getByRole('button', { name: /eliminar/i });
    this.btnConfirmarEliminar = page.getByRole('button', { name: /confirmar/i });

    this.detailPanel = page.getByTestId('contacto-detail-panel');
    this.clienteAsociadoLink = page.getByTestId('clienteAsociadoLink');
    this.sinClienteAsignado = page.getByTestId('sin-cliente-asignado');
    this.btnVolver = page.getByTestId('btn-volver');
  }

  async goto() {
    await this.page.goto('/contactos');
    await this.page.waitForURL('**/contactos**');
  }

  async abrirFormularioNuevo() {
    await this.btnNuevoContacto.click();
    await expect(this.form).toBeVisible();
  }

  async llenarFormulario(data: {
    nombre?: string;
    email?: string;
    cargo?: string;
    telefono?: string;
  }) {
    if (data.nombre) await this.inputNombre.fill(data.nombre);
    if (data.email) await this.inputEmail.fill(data.email);
    if (data.cargo) await this.inputCargo.fill(data.cargo);
    if (data.telefono) await this.inputTelefono.fill(data.telefono);
  }

  async guardar() {
    await this.btnGuardar.click();
    await expect(this.form).toBeHidden();
  }

  async seleccionarContacto(nombre: string) {
    await this.page
      .getByTestId('contacto-row')
      .filter({ hasText: nombre })
      .click();
  }

  async buscar(termino: string) {
    await this.searchInput.fill(termino);
  }
}
