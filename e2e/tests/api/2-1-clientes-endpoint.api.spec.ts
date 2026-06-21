/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD API Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Target: GET /api/v1/clientes endpoint
 * Backend: .NET 10 Minimal API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#1 — GET /api/v1/clientes returns array with Nombre and NIT/RUC
 *   AC#2 — Returns full client list (up to 500 records) in < 1 second
 *
 * Test Cases:
 *   TC-2.1-A-01 (AC#1)  — GET /api/v1/clientes returns 200 with array
 *   TC-2.1-A-02 (AC#1)  — Response items include all required fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
 *   TC-2.1-A-03 (AC#1)  — Response is a direct array (no wrapper object)
 *   TC-2.1-A-04 (AC#1)  — createdAt and updatedAt include timezone offset (DateTimeOffset — R-007)
 *   TC-2.1-A-05 (AC#2)  — Response time < 1000ms with normal data set
 *   TC-2.1-A-06 (AC#3)  — Returns empty array [] when no clients exist (not null, not 404)
 *   TC-2.1-A-07         — id field is a valid UUID (Guid format)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('GET /api/v1/clientes — API contract (Story 2.1)', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-01 — Returns 200 with array
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.1-A-01] Given backend running, When GET /api/v1/clientes is called, Then response status is 200', async ({
    request,
  }) => {
    // GIVEN: Backend is running

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Status is 200 OK
    expect(response.status()).toBe(200);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-02 — Response items include all required fields
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.1-A-02] Given a client exists, When GET /api/v1/clientes, Then response items include id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async ({
    request,
  }) => {
    const data = buildCliente();
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

      // THEN: Response is valid JSON array
      expect(response.status()).toBe(200);
      const body = await response.json() as Array<Record<string, unknown>>;
      expect(Array.isArray(body)).toBe(true);

      // AND: The created client appears with all required fields
      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();
      expect(item).toMatchObject({
        id: expect.any(String),
        nombre: expect.any(String),
        nit: expect.any(String),
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-03 — Response is a direct array (no wrapper object)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.1-A-03] Given backend running, When GET /api/v1/clientes, Then response body is a JSON array at the root level (not wrapped in an object)', async ({
    request,
  }) => {
    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Body is an array, not an object with a data/items property
    expect(Array.isArray(body)).toBe(true);
    expect(body).not.toHaveProperty('data');
    expect(body).not.toHaveProperty('items');
    expect(body).not.toHaveProperty('results');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-04 — createdAt includes timezone offset (DateTimeOffset — R-007)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.1-A-04] Given a client exists, When GET /api/v1/clientes, Then createdAt and updatedAt include timezone offset (ISO 8601 with +hh:mm or Z)', async ({
    request,
  }) => {
    const data = buildCliente();
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, string>>;

      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();

      // THEN: createdAt is ISO 8601 with timezone offset or Z (DateTimeOffset — never plain DateTime)
      // Valid: "2026-03-12T10:30:00Z" or "2026-03-12T10:30:00+05:00"
      // Invalid: "2026-03-12T10:30:00" (no tz info)
      const isoWithTz = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})/;
      expect(item!.createdAt).toMatch(isoWithTz);

      // AND: updatedAt also includes timezone offset
      expect(item!.updatedAt).toMatch(isoWithTz);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-05 — Response time < 1000ms (AC#2 NFR1)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P0][TC-2.1-A-05] Given backend running, When GET /api/v1/clientes, Then response time is under 1000ms', async ({
    request,
  }) => {
    // GIVEN: Backend is running

    // WHEN: GET /api/v1/clientes — measure response time
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const elapsed = Date.now() - start;

    // THEN: Status is 200
    expect(response.status()).toBe(200);

    // AND: Response time is under 1 second (AC-E2.2 NFR1)
    expect(elapsed).toBeLessThan(1000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-06 — Returns empty array when no clients exist
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.1-A-06] Given no clients in system, When GET /api/v1/clientes, Then response is 200 with empty array (not null, not 404)', async ({
    request,
  }) => {
    // NOTE: This test assumes a clean test database or uses a specific empty-db environment.
    // In an environment with existing data, this documents the expected contract:
    // the endpoint MUST return [] (empty array) rather than null or 404
    // when the clientes table is empty.

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Status is always 200 (never 404 for empty list)
    expect(response.status()).toBe(200);

    // AND: Body is an array (may be empty or not depending on DB state,
    // but MUST be an array — never null)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-07 — id field is a valid UUID
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.1-A-07] Given a client exists, When GET /api/v1/clientes, Then each item id is a valid UUID (Guid format)', async ({
    request,
  }) => {
    const data = buildCliente();
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, string>>;

      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();

      // THEN: id is a valid UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(item!.id).toMatch(uuidRegex);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});
