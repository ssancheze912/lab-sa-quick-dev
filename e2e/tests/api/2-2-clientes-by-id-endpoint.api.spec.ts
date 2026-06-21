/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD API Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Target: GET /api/v1/clientes/{id} endpoint
 * Backend: .NET 10 Minimal API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#2 — GET /api/v1/clientes/{id} returns correct client data (FR30, R-005)
 *   AC#3 — GET /api/v1/clientes/{nonexistent-id} returns 404 Problem Details without stackTrace (NFR6)
 *
 * Test Cases:
 *   TC-2.2-A-01 (P2, AC#3) — GET /api/v1/clientes/{nonexistent-id} → 404 Problem Details without stackTrace field (NFR6)
 *   TC-2.2-A-02 (P2, AC#2) — GET /api/v1/clientes/{id} → createdAt includes timezone offset ISO 8601 (R-007)
 *   TC-2.2-A-03 (P1, AC#2) — GET /api/v1/clientes/{id} → 200 with correct client shape
 *   TC-2.2-A-04 (P1, AC#2) — GET /api/v1/clientes/{id} → response body contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt
 *   TC-2.2-A-05 (P2, AC#3) — GET /api/v1/clientes/{nonexistent-id} → 404 response status exactly
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('GET /api/v1/clientes/{id} — API contract (Story 2.2)', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-03 — 200 with correct client shape
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.2-A-03] Given a client exists, When GET /api/v1/clientes/{id}, Then response status is 200', async ({
    request,
  }) => {
    // GIVEN: A client is created
    const data = buildCliente();
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

      // THEN: Status is 200 OK
      expect(response.status()).toBe(200);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-04 — Response contains all required fields
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.2-A-04] Given a client exists, When GET /api/v1/clientes/{id}, Then response body contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async ({
    request,
  }) => {
    // GIVEN: A client is created with all fields
    const data = buildCliente({ nombre: 'API Shape Test SA', nit: '900100200-3' });
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: Response contains all required fields
      expect(response.status()).toBe(200);
      expect(body).toMatchObject({
        id: expect.any(String),
        nombre: expect.any(String),
        nit: expect.any(String),
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // AND: The returned data matches the created client
      expect(body.id).toBe(created.id);
      expect(body.nombre).toBe(data.nombre);
      expect(body.nit).toBe(data.nit);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-02 — createdAt includes timezone offset (R-007)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.2-A-02] Given a client exists, When GET /api/v1/clientes/{id}, Then createdAt includes timezone offset (ISO 8601 with +hh:mm or Z) — R-007', async ({
    request,
  }) => {
    // GIVEN: A client is created
    const data = buildCliente();
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
      const body = await response.json() as Record<string, string>;

      expect(response.status()).toBe(200);

      // THEN: createdAt is ISO 8601 with timezone offset or Z (DateTimeOffset — never plain DateTime)
      // Valid: "2026-03-12T10:30:00Z" or "2026-03-12T10:30:00+05:00"
      // Invalid: "2026-03-12T10:30:00" (no timezone info)
      const isoWithTz = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})/;
      expect(body.createdAt).toMatch(isoWithTz);

      // AND: updatedAt also includes timezone offset
      expect(body.updatedAt).toMatch(isoWithTz);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-05 — Non-existent clienteId returns 404 status exactly
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.2-A-05] Given a clienteId does not exist, When GET /api/v1/clientes/{id}, Then response status is 404', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not exist in the database
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{nonexistent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: Status is 404 Not Found
    expect(response.status()).toBe(404);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-01 — 404 returns Problem Details without stackTrace (NFR6)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.2-A-01] Given a clienteId does not exist, When GET /api/v1/clientes/{id}, Then response is Problem Details RFC 7807 without stackTrace field (NFR6)', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not exist in the database
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{nonexistent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Status is 404
    expect(response.status()).toBe(404);

    // AND: Response follows Problem Details RFC 7807 shape (title and/or status field)
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('status');

    // AND: No stackTrace field is exposed (NFR6 — never expose internal error details)
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('stack_trace');
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('traceId');
  });
});
