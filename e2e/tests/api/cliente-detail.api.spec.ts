/**
 * API Integration Tests — GET /api/v1/clientes/:id (Story 2.2)
 *
 * Acceptance Criteria covered:
 *   AC-2: GET /api/v1/clientes/:id returns correct ClienteDto on 200 OK
 *   AC-3: GET /api/v1/clientes/:id returns 404 Problem Details for unknown id
 *
 * Test matrix (test-design-epic-2.md — Story 2.2):
 *   API-01 — GET /api/v1/clientes/:id returns 200 with correct ClienteDto fields (P0)
 *   API-02 — GET /api/v1/clientes/:id returns 404 Problem Details for non-existent UUID (P0)
 *
 * Uses Playwright's APIRequestContext (no browser UI).
 * Serial execution to avoid parallel DB state conflicts.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

const TEST_ID_DETAIL_01 = '00000000-0000-0000-0001-000000000001';
const TEST_ID_DETAIL_02 = '00000000-0000-0000-0001-000000000002';
const NON_EXISTENT_UUID = '99999999-9999-9999-9999-999999999999';

function psql(sql: string): void {
  execSync(
    `PGPASSWORD=postgres psql -h localhost -U postgres -d siesa_agents_db -c "${sql}"`,
    { stdio: 'pipe' },
  );
}

test.describe.configure({ mode: 'serial' });

test.describe('GET /api/v1/clientes/:id', () => {

  // ---------------------------------------------------------------------------
  // API-01 — GET 200 with correct ClienteDto fields (P0)
  // ---------------------------------------------------------------------------
  test(
    '[P0] GIVEN a client exists in the system '
    + 'WHEN GET /api/v1/clientes/:id is called with the correct id '
    + 'THEN it returns 200 OK with a ClienteDto object matching all documented fields',
    async ({ request }) => {
      // GIVEN: insert a test client record
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_DETAIL_01}', 'Detail API Test Corp', '900100001', '3001000101', 'Bogota', NOW(), NOW());`,
      );

      try {
        // WHEN: call the single-record endpoint
        const response = await request.get(`${API_BASE}/api/v1/clientes/${TEST_ID_DETAIL_01}`);

        // THEN: 200 OK
        expect(response.status()).toBe(200);

        const body = await response.json();

        // THEN: response is a single object (not an array)
        expect(Array.isArray(body)).toBe(false);
        expect(typeof body).toBe('object');

        // THEN: all documented ClienteDto fields are present
        expect(body).toMatchObject({
          id: TEST_ID_DETAIL_01,
          nombre: 'Detail API Test Corp',
          nit: expect.any(String),
          telefono: expect.any(String),
          ciudad: expect.any(String),
          createdAt: expect.any(String),
        });
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      }
    },
  );

  // ---------------------------------------------------------------------------
  // API-02 — GET 404 Problem Details for non-existent UUID (P0)
  // ---------------------------------------------------------------------------
  test(
    '[P0] GIVEN a clienteId that does not exist in the system '
    + 'WHEN GET /api/v1/clientes/:id is called '
    + 'THEN it returns 404 with Problem Details (RFC 7807) and no stackTrace',
    async ({ request }) => {
      // GIVEN: ensure the UUID is not in the database
      psql(`DELETE FROM clientes WHERE id = '${NON_EXISTENT_UUID}';`);

      // WHEN: call the endpoint with non-existent UUID
      const response = await request.get(`${API_BASE}/api/v1/clientes/${NON_EXISTENT_UUID}`);

      // THEN: 404 status
      expect(response.status()).toBe(404);

      // THEN: Problem Details RFC 7807 shape
      const body = await response.json();
      expect(body).toMatchObject({
        status: 404,
        title: expect.any(String),
      });

      // THEN: no stackTrace in response body (NFR6)
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('exceptionDetails');
    },
  );

  // ---------------------------------------------------------------------------
  // API-03 — Response is direct object (no data wrapper) (P1)
  // ---------------------------------------------------------------------------
  test(
    '[P1] GIVEN a client exists '
    + 'WHEN GET /api/v1/clientes/:id returns 200 '
    + 'THEN the response body is a direct ClienteDto object (no wrapper)',
    async ({ request }) => {
      // GIVEN: insert record
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_02}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_DETAIL_02}', 'No Wrapper Test Co', '900100002', '3001000202', 'Medellin', NOW(), NOW());`,
      );

      try {
        const response = await request.get(`${API_BASE}/api/v1/clientes/${TEST_ID_DETAIL_02}`);
        expect(response.status()).toBe(200);

        const body = await response.json();

        // THEN: root value is an object with the documented fields (not a wrapper)
        expect(body).not.toHaveProperty('data');
        expect(body).not.toHaveProperty('items');
        expect(body).not.toHaveProperty('result');
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('nombre');
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_02}';`);
      }
    },
  );

  // ---------------------------------------------------------------------------
  // API-04 — Content-Type header is application/json (P1)
  // ---------------------------------------------------------------------------
  test(
    '[P1] GIVEN a client exists '
    + 'WHEN GET /api/v1/clientes/:id responds '
    + 'THEN Content-Type is application/json',
    async ({ request }) => {
      // GIVEN: insert record
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_DETAIL_01}', 'Content Type Test', '900100003', '3001000303', 'Cali', NOW(), NOW());`,
      );

      try {
        // WHEN
        const response = await request.get(`${API_BASE}/api/v1/clientes/${TEST_ID_DETAIL_01}`);

        // THEN: JSON content type
        expect(response.status()).toBe(200);
        const contentType = response.headers()['content-type'];
        expect(contentType).toMatch(/application\/json/);
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      }
    },
  );

  // ---------------------------------------------------------------------------
  // API-05 — createdAt is a valid ISO 8601 date string (P1)
  // ---------------------------------------------------------------------------
  test(
    '[P1] GIVEN a client exists '
    + 'WHEN GET /api/v1/clientes/:id returns 200 '
    + 'THEN the createdAt field is a valid ISO 8601 date string',
    async ({ request }) => {
      // GIVEN: insert record
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_DETAIL_01}', 'ISO Date Test', '900100004', '3001000404', 'Barranquilla', NOW(), NOW());`,
      );

      try {
        const response = await request.get(`${API_BASE}/api/v1/clientes/${TEST_ID_DETAIL_01}`);
        expect(response.status()).toBe(200);

        const body = await response.json();

        // THEN: createdAt parses as valid date
        const parsed = new Date(body.createdAt);
        expect(parsed.getTime()).not.toBeNaN();

        // THEN: includes timezone info (Z or offset)
        expect(body.createdAt).toMatch(/Z$|[+-]\d{2}:\d{2}$/);
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      }
    },
  );

  // ---------------------------------------------------------------------------
  // API-06 — No internal fields leaked in response (P2)
  // ---------------------------------------------------------------------------
  test(
    '[P2] GIVEN a client exists '
    + 'WHEN GET /api/v1/clientes/:id returns a ClienteDto '
    + 'THEN no internal fields are leaked in the response body',
    async ({ request }) => {
      // GIVEN: insert record
      psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      psql(
        `INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at) ` +
        `VALUES ('${TEST_ID_DETAIL_01}', 'Schema Boundary Test', '900100005', '3001000505', 'Pereira', NOW(), NOW());`,
      );

      try {
        const response = await request.get(`${API_BASE}/api/v1/clientes/${TEST_ID_DETAIL_01}`);
        expect(response.status()).toBe(200);

        const body = await response.json();
        const returnedFields = new Set(Object.keys(body));

        // THEN: documented fields present
        const documentedFields = ['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt'];
        for (const field of documentedFields) {
          expect(returnedFields.has(field), `Missing documented field: ${field}`).toBe(true);
        }

        // THEN: internal DB fields NOT leaked
        expect(returnedFields.has('updatedAt')).toBe(false);
        expect(returnedFields.has('updated_at')).toBe(false);
        expect(returnedFields.has('created_at')).toBe(false);
      } finally {
        psql(`DELETE FROM clientes WHERE id = '${TEST_ID_DETAIL_01}';`);
      }
    },
  );
});
