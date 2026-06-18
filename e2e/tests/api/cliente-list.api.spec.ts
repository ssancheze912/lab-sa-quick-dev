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
import { execSync } from 'child_process';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

// Fixed IDs used by each test — distinct to avoid cross-test collision
const TEST_ID_01 = '00000000-0000-0000-0000-000000000001';

function psql(sql: string): void {
  execSync(
    `PGPASSWORD=postgres psql -h localhost -U postgres -d siesa_agents_db -c "${sql}"`,
    { stdio: 'pipe' },
  );
}

// ---------------------------------------------------------------------------
// API-01 — GET /api/v1/clientes returns 200 with ClienteDto[] (P0)
// ---------------------------------------------------------------------------
// Run serially: these tests share the database; parallel execution causes flakiness
test.describe.configure({ mode: 'serial' });

test.describe('GET /api/v1/clientes', () => {
  test(
    'GIVEN there are clients in the system '
    + 'WHEN GET /api/v1/clientes is called '
    + 'THEN it returns 200 OK with a JSON array containing ClienteDto objects',
    async ({ request }) => {
      const data = buildCliente({ nombre: 'API Test Corp' });

      // GIVEN: insert a test record directly via psql (POST not implemented in Story 2.1)
      // Ensure clean state first, then insert
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_01}', '${data.nombre}', '900123456', '3001234567', 'Bogota', NOW(), NOW());`,
      );

      try {
        // WHEN: call the list endpoint
        const response = await request.get(`${API_BASE}/api/v1/clientes`);

        // THEN: 200 with array
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThanOrEqual(1);

        // Verify response shape matches ClienteDto contract
        const found = body.find((c: { id: string }) => c.id === TEST_ID_01);
        expect(found).toBeDefined();
        expect(found).toMatchObject({
          id: expect.any(String),
          nombre: data.nombre,
          nit: expect.any(String),
          telefono: expect.any(String),
          ciudad: expect.any(String),
          createdAt: expect.any(String),
        });
      } finally {
        // Cleanup: remove only this test's record
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_01}';`);
      }
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
      // GIVEN: ensure no clients exist (tests run serially, so this is safe)
      psql(`DELETE FROM clientes;`);

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
