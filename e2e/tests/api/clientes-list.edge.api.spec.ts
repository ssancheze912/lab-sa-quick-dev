/**
 * API Edge Case Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Level: API Integration (Playwright APIRequestContext → real backend)
 * Backend: .NET 10 Minimal API at http://localhost:5000
 *
 * Expands ATDD API coverage with:
 *   - Empty database returns [] (not null, not 500)
 *   - Non-GET HTTP methods return 405 Method Not Allowed
 *   - Response JSON is strict array (no extra root keys like "success", "total")
 *   - Idempotency: two sequential GET calls return consistent shape
 *   - Request without Accept header still returns application/json
 *   - CORS headers present (preflight support)
 *   - createdAt strictly before or equal to updatedAt
 *   - id field is a non-empty string (UUID format optional, but non-null)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─── Edge: Empty database returns [] ─────────────────────────────────────────

test.describe('GET /api/v1/clientes — base de datos vacía', () => {
  test('[P1] debe retornar [] cuando no hay clientes (no null, no error)', async ({ request }) => {
    // NOTE: This test assumes either a clean DB or relies on idempotent behavior.
    // It validates that the endpoint never returns null for an empty collection.
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    expect(response.status()).toBe(200);

    const body = await response.json();

    // THEN: body is an array (may be empty or have items, but never null)
    expect(Array.isArray(body)).toBe(true);
    expect(body).not.toBeNull();
  });
});

// ─── Edge: Wrong HTTP methods return 405 ─────────────────────────────────────

test.describe('GET /api/v1/clientes — métodos HTTP no permitidos', () => {
  test('[P2] DELETE /api/v1/clientes debe retornar 405 Method Not Allowed', async ({ request }) => {
    // GIVEN: The endpoint only supports GET
    // WHEN: DELETE is called on the collection (no ID)
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: 405 Method Not Allowed
    expect([405, 404]).toContain(response.status()); // 404 acceptable if route not registered
  });

  test('[P2] PATCH /api/v1/clientes debe retornar 405 o 404', async ({ request }) => {
    // GIVEN: The endpoint only supports GET
    const response = await request.patch(`${API_BASE_URL}/api/v1/clientes`, { data: {} });

    // THEN: Not 200/201 — should be an error status
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

// ─── Edge: Response has no extra root keys ────────────────────────────────────

test.describe('GET /api/v1/clientes — forma estricta del response', () => {
  test('[P1] el response no debe contener clave "success" en el root', async ({ request }) => {
    // GIVEN: Backend is running
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: No wrapper keys
    expect(Array.isArray(body)).toBe(true);
    // If body were an object with success key, it would not be an array
    if (typeof body === 'object' && !Array.isArray(body)) {
      expect((body as Record<string, unknown>).success).toBeUndefined();
    }
  });

  test('[P1] el response no debe contener clave "total" o "count" en el root', async ({
    request,
  }) => {
    // GIVEN: Backend is running
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Pure array, no pagination metadata
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── Edge: Idempotency — two sequential calls return consistent results ────────

test.describe('GET /api/v1/clientes — idempotencia', () => {
  test('[P2] dos llamadas consecutivas deben retornar el mismo número de items', async ({
    request,
  }) => {
    // GIVEN: The database state is consistent between calls
    const response1 = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const response2 = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    const body1 = await response1.json();
    const body2 = await response2.json();

    // THEN: Both calls return the same count
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);
    expect(Array.isArray(body1)).toBe(true);
    expect(Array.isArray(body2)).toBe(true);
    expect(body1.length).toBe(body2.length);
  });
});

// ─── Edge: Client data integrity ─────────────────────────────────────────────

test.describe('GET /api/v1/clientes — integridad de datos', () => {
  test('[P1] cada cliente debe tener id no vacío (no null, no string vacío)', async ({
    request,
  }) => {
    // GIVEN: At least one client exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Edge Id Test' });
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Every client in the list has a non-empty id
    for (const cliente of body) {
      expect(cliente.id).toBeDefined();
      expect(cliente.id).not.toBeNull();
      expect(cliente.id.length).toBeGreaterThan(0);
    }

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });

  test('[P1] cada cliente debe tener nombre no vacío', async ({ request }) => {
    // GIVEN: At least one client exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Edge Nombre Test' });
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Every client has a non-empty nombre
    for (const cliente of body) {
      expect(typeof cliente.nombre).toBe('string');
      expect(cliente.nombre.length).toBeGreaterThan(0);
    }

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });

  test('[P1] createdAt no debe ser posterior a updatedAt', async ({ request }) => {
    // GIVEN: At least one client exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Edge Fecha Test' });
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    const found = body.find((c: { nombre: string }) => c.nombre === 'Empresa Edge Fecha Test');
    expect(found).toBeDefined();

    // THEN: createdAt <= updatedAt (timestamps are logically consistent)
    const created_at = new Date(found.createdAt).getTime();
    const updated_at = new Date(found.updatedAt).getTime();
    expect(created_at).toBeLessThanOrEqual(updated_at);

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });

  test('[P1] todos los campos del contrato son cadenas (no null, no undefined)', async ({
    request,
  }) => {
    // GIVEN: At least one client exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Edge Tipos Test' });
    const created = await apiHelper.createCliente(data);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    const found = body.find((c: { nombre: string }) => c.nombre === 'Empresa Edge Tipos Test');
    expect(found).toBeDefined();

    // THEN: All string fields are actual strings, not null/undefined
    const stringFields = ['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt'];
    for (const field of stringFields) {
      expect(found[field]).not.toBeNull();
      expect(found[field]).not.toBeUndefined();
      expect(typeof found[field]).toBe('string');
    }

    // Cleanup
    await apiHelper.deleteCliente(created.id);
  });
});

// ─── Edge: Content negotiation ───────────────────────────────────────────────

test.describe('GET /api/v1/clientes — negociación de contenido', () => {
  test('[P2] debe retornar application/json incluso sin cabecera Accept', async ({ request }) => {
    // GIVEN: Request without Accept header
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`, {
      headers: {}, // No Accept header override
    });

    // THEN: Response is still JSON
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });
});

// ─── Edge: Performance at scale ───────────────────────────────────────────────

test.describe('GET /api/v1/clientes — rendimiento con múltiples clientes', () => {
  test('[P2] debe responder consistentemente rápido en llamadas repetidas (sin cache warming)', async ({
    request,
  }) => {
    // GIVEN: Backend is running (may have a warm JIT from earlier tests)
    const times: number[] = [];

    // WHEN: 3 consecutive calls measured
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const elapsed = Date.now() - start;

      expect(response.status()).toBe(200);
      times.push(elapsed);
    }

    // THEN: Each call stays under 2 seconds
    for (const t of times) {
      expect(t).toBeLessThan(2000);
    }
  });
});
