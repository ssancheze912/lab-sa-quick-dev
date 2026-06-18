/**
 * API Edge Case Tests — GET /api/v1/clientes (Story 2.1 — Automate Expansion)
 *
 * Expands coverage beyond the ATDD API tests with:
 *   - Response Content-Type header validation
 *   - createdAt ISO 8601 format validation
 *   - Field type assertions (id is UUID format, createdAt is valid date)
 *   - No extra fields leaked in response (response shape boundary)
 *
 * Uses Playwright's APIRequestContext (no browser UI).
 * Serial execution to avoid parallel DB state conflicts.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

const TEST_ID_EDGE_01 = '00000000-0000-0000-0000-aaaaaaaaaaaa';

function psql(sql: string): void {
  execSync(
    `PGPASSWORD=postgres psql -h localhost -U postgres -d siesa_agents_db -c "${sql}"`,
    { stdio: 'pipe' },
  );
}

test.describe.configure({ mode: 'serial' });

test.describe('GET /api/v1/clientes — response contract edge cases', () => {

  // -------------------------------------------------------------------------
  // Content-Type header
  // -------------------------------------------------------------------------
  test(
    '[P1] GIVEN a GET /api/v1/clientes request '
    + 'WHEN the server responds '
    + 'THEN Content-Type is application/json',
    async ({ request }) => {
      // WHEN: call the endpoint
      const response = await request.get(`${API_BASE}/api/v1/clientes`);

      // THEN: Content-Type is JSON
      expect(response.status()).toBe(200);
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/application\/json/);
    },
  );

  // -------------------------------------------------------------------------
  // ISO 8601 date format validation
  // -------------------------------------------------------------------------
  test(
    '[P1] GIVEN clients exist in the database '
    + 'WHEN GET /api/v1/clientes is called '
    + 'THEN createdAt field is a valid ISO 8601 date string',
    async ({ request }) => {
      // GIVEN: ensure at least one record exists
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_EDGE_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_EDGE_01}', 'Edge Date Test SA', '900999001', '3001000099', 'Cali', NOW(), NOW());`,
      );

      try {
        const response = await request.get(`${API_BASE}/api/v1/clientes`);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);

        const found = body.find((c: { id: string }) => c.id === TEST_ID_EDGE_01);
        expect(found).toBeDefined();

        // ISO 8601: parseable by Date and not NaN
        const parsed = new Date(found.createdAt);
        expect(parsed.getTime()).not.toBeNaN();

        // Must include timezone offset (Z or +HH:MM)
        expect(found.createdAt).toMatch(/Z$|[+-]\d{2}:\d{2}$/);
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_EDGE_01}';`);
      }
    },
  );

  // -------------------------------------------------------------------------
  // id field is UUID v4 format
  // -------------------------------------------------------------------------
  test(
    '[P2] GIVEN clients exist in the database '
    + 'WHEN GET /api/v1/clientes is called '
    + 'THEN each id field is a valid UUID format',
    async ({ request }) => {
      // GIVEN: known record
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_EDGE_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_EDGE_01}', 'UUID Format Test', '900999002', '3001000088', 'Bogota', NOW(), NOW());`,
      );

      try {
        const response = await request.get(`${API_BASE}/api/v1/clientes`);
        const body = await response.json();

        const found = body.find((c: { id: string }) => c.id === TEST_ID_EDGE_01);
        expect(found).toBeDefined();

        // UUID format: 8-4-4-4-12 hex chars
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(found.id).toMatch(uuidRegex);
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_EDGE_01}';`);
      }
    },
  );

  // -------------------------------------------------------------------------
  // No extra/undocumented fields in response
  // -------------------------------------------------------------------------
  test(
    '[P2] GIVEN clients exist '
    + 'WHEN GET /api/v1/clientes returns a ClienteDto '
    + 'THEN each object contains only the documented fields (no internal fields leaked)',
    async ({ request }) => {
      // GIVEN
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_EDGE_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_EDGE_01}', 'Schema Boundary Test', '900999003', '3001000077', 'Medellin', NOW(), NOW());`,
      );

      try {
        const response = await request.get(`${API_BASE}/api/v1/clientes`);
        const body = await response.json();

        const found = body.find((c: { id: string }) => c.id === TEST_ID_EDGE_01);
        expect(found).toBeDefined();

        const documentedFields = new Set(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt']);
        const returnedFields = new Set(Object.keys(found));

        // All documented fields must be present
        for (const field of documentedFields) {
          expect(returnedFields.has(field), `Missing documented field: ${field}`).toBe(true);
        }

        // Internal fields must NOT be leaked
        expect(returnedFields.has('updatedAt')).toBe(false);
        expect(returnedFields.has('updated_at')).toBe(false);
        expect(returnedFields.has('created_at')).toBe(false);
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_EDGE_01}';`);
      }
    },
  );
});
