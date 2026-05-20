import { APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * Helper for direct REST API calls in E2E tests (setup/teardown data).
 * Uses Playwright's APIRequestContext for typed HTTP requests.
 */
export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  // --- Clientes ---

  async createCliente(data: {
    nombre: string;
    nit: string;
    telefono?: string;
    ciudad?: string;
  }) {
    const response = await this.request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data,
    });
    return response.json();
  }

  async deleteCliente(id: string) {
    await this.request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`);
  }

  async getClientes() {
    const response = await this.request.get(`${API_BASE_URL}/api/v1/clientes`);
    return response.json();
  }

  // --- Contactos ---

  async createContacto(data: {
    nombre: string;
    email: string;
    cargo?: string;
    telefono?: string;
    clienteId?: string | null;
  }) {
    const response = await this.request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data,
    });
    return response.json();
  }

  async deleteContacto(id: string) {
    await this.request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`);
  }

  async getContactos() {
    const response = await this.request.get(`${API_BASE_URL}/api/v1/contactos`);
    return response.json();
  }

  // --- Asociaciones ---

  async asignarClienteAContacto(contactoId: string, clienteId: string | null) {
    await this.request.put(
      `${API_BASE_URL}/api/v1/contactos/${contactoId}/cliente`,
      { data: { clienteId } }
    );
  }
}
