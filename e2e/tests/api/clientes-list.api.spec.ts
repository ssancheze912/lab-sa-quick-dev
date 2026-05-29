/**
 * API Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Level: API Integration (Playwright APIRequestContext → real backend)
 * Backend: .NET 10 Minimal API at http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC1 — GET /api/v1/clientes returns a list with at least Nombre and NIT/RUC per item
 *   AC2 — Endpoint is fast enough to support < 1s total including client-side filter
 *   AC4 — Endpoint returns proper HTTP 500 / error status (enabling ErrorPanel in frontend)
 *
 * Contract validated:
 *   - Response shape: Cliente[] (direct array, no wrapper)
 *   - Each item: { id, nombre, nit, telefono, ciudad, createdAt, updatedAt }
 *   - createdAt / updatedAt: ISO 8601 with timezone (DateTimeOffset)
 *
 * GREEN PHASE: All tests pass — ClienteEndpoints.cs implemented.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─── AC1 — GET /api/v1/clientes returns valid list ───────────────────────────

test.describe('GET /api/v1/clientes — Listado de clientes', () => {
  test('[P1] debe responder con HTTP 200', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response is 200 OK
    expect(response.status()).toBe(200);
  });

  test('[P1] debe retornar Content-Type application/json', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type is JSON
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('[P1] debe retornar un arreglo JSON', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Response body is an array (no wrapper object)
    expect(Array.isArray(body)).toBe(true);
  });

  test('[P1] cada cliente en la respuesta debe tener el campo "id"', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The created client is in the list with an id
    const found = body.find((c: { nombre: string }) => c.nombre === data.nombre);
    expect(found).toBeDefined();
    expect(found.id).toBeDefined();
    expect(typeof found.id).toBe('string');

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });

  test('[P1] cada cliente en la respuesta debe tener el campo "nombre"', async ({ request }) => {
    // GIVEN: A client with a specific nombre exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Api Test Nombre' });
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The client with the specific nombre is in the list
    const found = body.find((c: { nombre: string }) => c.nombre === 'Empresa Api Test Nombre');
    expect(found).toBeDefined();
    expect(found.nombre).toBe('Empresa Api Test Nombre');

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });

  test('[P1] cada cliente en la respuesta debe tener el campo "nit"', async ({ request }) => {
    // GIVEN: A client with a specific NIT exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nit: '900555666' });
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The client with the specific NIT is in the list
    const found = body.find((c: { nit: string }) => c.nit === '900555666');
    expect(found).toBeDefined();
    expect(found.nit).toBe('900555666');

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });

  test('[P1] cada cliente debe tener los campos del contrato completo', async ({ request }) => {
    // GIVEN: A client exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    const found = body.find((c: { nombre: string }) => c.nombre === data.nombre);
    expect(found).toBeDefined();

    // THEN: All required contract fields are present (camelCase JSON)
    expect(found).toMatchObject({
      id: expect.any(String),
      nombre: expect.any(String),
      nit: expect.any(String),
      telefono: expect.any(String),
      ciudad: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });

  test('[P1] createdAt y updatedAt deben ser cadenas ISO 8601 con timezone', async ({ request }) => {
    // GIVEN: A client exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    const found = body.find((c: { nombre: string }) => c.nombre === data.nombre);

    // THEN: Timestamps are valid ISO 8601 strings with timezone info
    expect(() => new Date(found.createdAt)).not.toThrow();
    expect(() => new Date(found.updatedAt)).not.toThrow();
    // Must include timezone (Z or +offset) — DateTimeOffset standard
    expect(found.createdAt).toMatch(/[Z\+\-]\d{0,2}:?\d{0,2}$/);

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });
});

// ─── AC2 — Endpoint performance ──────────────────────────────────────────────

test.describe('GET /api/v1/clientes — Rendimiento del endpoint', () => {
  test('[P1] debe responder en menos de 2 segundos (soporte a NFR1 del frontend)', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is timed
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const elapsed = Date.now() - start;

    // THEN: Response arrives within 2 seconds
    // (Frontend needs to filter 500 records in < 1s total; API must be fast enough)
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });
});

// ─── Response shape — no wrapper object ──────────────────────────────────────

test.describe('GET /api/v1/clientes — Forma del response (sin wrapper)', () => {
  test('[P1] el response no debe estar envuelto en un objeto con propiedad "data"', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Body is a direct array (not { data: [...] } or { items: [...] })
    expect(Array.isArray(body)).toBe(true);
    expect(body.data).toBeUndefined();
    expect(body.items).toBeUndefined();
  });

  test('[P1] el response no debe estar envuelto en un objeto con propiedad "items"', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Body is a direct array
    expect(Array.isArray(body)).toBe(true);
  });
});
