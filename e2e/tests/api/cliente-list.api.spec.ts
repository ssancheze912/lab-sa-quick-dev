/**
 * API Integration Tests — GET /api/v1/clientes (Story 2.1)
 * RED phase: tests fail until the backend endpoint is implemented.
 *
 * Acceptance Criteria covered:
 *   AC-1: GET /api/v1/clientes returns array of clients with correct fields
 *   AC-3 (edge case): GET /api/v1/clientes returns [] when no clients exist
 *
 * Test matrix (test-design-epic-2.md — Story 2.1):
 *   API-01 — GET 200 with items; response contains expected ClienteDto fields (P0)
 *   API-02 — GET 200 empty array when no clients in DB (P0)
 *
 * Uses Playwright's APIRequestContext (no browser UI involved).
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// API-01 — GET /api/v1/clientes returns 200 with ClienteDto[] (P0)
// ---------------------------------------------------------------------------
test.describe('GET /api/v1/clientes', () => {
  test(
    'GIVEN there are clients in the system '
    + 'WHEN GET /api/v1/clientes is called '
    + 'THEN it returns 200 OK with a JSON array containing ClienteDto objects',
    async ({ request }) => {
      const apiHelper = new ApiHelper(request);

      // GIVEN: create at least one client via the API
      const data = buildCliente({ nombre: 'API Test Corp' });
      const created = await apiHelper.createCliente(data);

      // WHEN: call the list endpoint
      const response = await request.get(`${API_BASE}/api/v1/clientes`);

      // THEN: 200 with array
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);

      // Verify response shape matches ClienteDto contract
      const found = body.find((c: { id: string }) => c.id === created.id);
      expect(found).toBeDefined();
      expect(found).toMatchObject({
        id: expect.any(String),
        nombre: data.nombre,
        nit: data.nit,
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
      });

      // Cleanup
      await apiHelper.deleteCliente(created.id).catch(() => null);
    },
  );

  // -------------------------------------------------------------------------
  // API-02 — GET returns 200 with [] when DB is empty
  // -------------------------------------------------------------------------
  test(
    'GIVEN there are no clients in the system '
    + 'WHEN GET /api/v1/clientes is called '
    + 'THEN it returns 200 OK with an empty array',
    async ({ request }) => {
      // GIVEN: ensure no clients exist — delete all via helper
      const apiHelper = new ApiHelper(request);
      const existing = await apiHelper.getClientes().catch(() => []);
      for (const c of existing) {
        await apiHelper.deleteCliente(c.id).catch(() => null);
      }

      // WHEN: call the list endpoint
      const response = await request.get(`${API_BASE}/api/v1/clientes`);

      // THEN: 200 with empty array (not 404, not null)
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    },
  );

  // -------------------------------------------------------------------------
  // API-03 — Response shape: direct array (no wrapper object)
  // -------------------------------------------------------------------------
  test(
    'GIVEN clients exist '
    + 'WHEN GET /api/v1/clientes is called '
    + 'THEN the response body is a direct JSON array (no wrapper object)',
    async ({ request }) => {
      // WHEN: call the endpoint
      const response = await request.get(`${API_BASE}/api/v1/clientes`);

      // THEN: root JSON value is an array, not an object with a data property
      expect(response.status()).toBe(200);
      const body = await response.json();

      expect(Array.isArray(body)).toBe(true);
      // Ensure no wrapper — body must NOT have a `data`, `items`, or `result` key
      expect(body).not.toHaveProperty('data');
      expect(body).not.toHaveProperty('items');
      expect(body).not.toHaveProperty('result');
    },
  );
});
