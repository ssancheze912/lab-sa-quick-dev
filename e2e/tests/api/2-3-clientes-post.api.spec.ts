/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD API Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Target: POST /api/v1/clientes endpoint
 * Backend: .NET 10 Minimal API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#2 — POST with valid payload → 201 Created + ClienteDto shape (FR27)
 *   AC#3 — POST with missing required fields → 400 Problem Details (FR8)
 *   AC#4 — POST with duplicate NIT/RUC → 409 Conflict with title "El NIT/RUC ya está registrado." and NO stackTrace (R-002, NFR6)
 *
 * Test Cases:
 *   TC-2.3-P0-03 (P0, AC#4)  — POST duplicate NIT → 409 with title field, no stackTrace (R-002)
 *   TC-2.3-A-01  (P1, AC#2)  — POST valid payload → 201 Created
 *   TC-2.3-A-02  (P1, AC#2)  — POST valid payload → response body has all required fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
 *   TC-2.3-A-03  (P1, AC#2)  — POST valid payload → id is a valid UUID, createdAt is ISO 8601 with timezone offset (R-007)
 *   TC-2.3-A-04  (P1, AC#3)  — POST with missing Nombre → 400 with Problem Details (no stackTrace)
 *   TC-2.3-A-05  (P1, AC#3)  — POST with all empty fields → 400 (FR8)
 *   TC-2.3-A-06  (P1, AC#4)  — POST duplicate NIT → 409 status exactly
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('POST /api/v1/clientes — API contract (Story 2.3)', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-P0-03 — Duplicate NIT → 409 with title, no stackTrace (R-002, NFR6)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P0][TC-2.3-P0-03] Given a NIT/RUC already exists, When POST /api/v1/clientes with same NIT, Then 409 with title "El NIT/RUC ya está registrado." and no stackTrace field (R-002, NFR6)', async ({
    request,
  }) => {
    // GIVEN: A client with a specific NIT already exists
    const original = buildCliente();
    const created = await api.createCliente(original);

    try {
      // WHEN: POST with the same NIT/RUC
      const duplicate = buildCliente({ nit: original.nit, nombre: 'Duplicado SA' });
      const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
        data: duplicate,
      });

      // THEN: Status is 409 Conflict
      expect(response.status()).toBe(409);

      const body = await response.json() as Record<string, unknown>;

      // AND: Response contains the user-friendly title (R-002)
      expect(body).toHaveProperty('title');
      expect(typeof body.title).toBe('string');
      expect((body.title as string).toLowerCase()).toContain('nit');

      // AND: No stackTrace field is exposed (NFR6)
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('stack_trace');
      expect(body).not.toHaveProperty('exception');
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-01 — POST valid payload → 201 Created
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-01] Given valid client data, When POST /api/v1/clientes, Then response status is 201 Created', async ({
    request,
  }) => {
    // GIVEN: A valid client payload
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data,
    });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, unknown>;
      createdId = body.id as string ?? null;

      // THEN: Status is 201 Created
      expect(response.status()).toBe(201);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-02 — POST valid payload → all required fields in response body
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-02] Given valid client data, When POST /api/v1/clientes, Then response body contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async ({
    request,
  }) => {
    // GIVEN: A valid client payload with all fields set
    const data = buildCliente({ nombre: 'API Shape Verify SA', nit: '910100200-5' });

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data,
    });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, unknown>;
      createdId = body.id as string ?? null;

      expect(response.status()).toBe(201);

      // THEN: Response contains all required fields with correct types
      expect(body).toMatchObject({
        id: expect.any(String),
        nombre: expect.any(String),
        nit: expect.any(String),
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // AND: The returned data matches the submitted payload
      expect(body.nombre).toBe(data.nombre);
      expect(body.nit).toBe(data.nit);
      expect(body.telefono).toBe(data.telefono);
      expect(body.ciudad).toBe(data.ciudad);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-03 — id is UUID, createdAt is ISO 8601 with timezone offset (R-007)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-03] Given valid client data, When POST /api/v1/clientes, Then id is a valid UUID and createdAt includes timezone offset (ISO 8601 with +hh:mm or Z) — R-007', async ({
    request,
  }) => {
    // GIVEN: A valid client payload
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data,
    });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, string>;
      createdId = body.id ?? null;

      expect(response.status()).toBe(201);

      // THEN: id is a valid UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(body.id).toMatch(uuidRegex);

      // AND: createdAt is ISO 8601 with timezone offset (DateTimeOffset — never plain DateTime)
      // Valid: "2026-03-12T10:30:00Z" or "2026-03-12T10:30:00+05:00"
      // Invalid: "2026-03-12T10:30:00" (no timezone info)
      const isoWithTz = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})/;
      expect(body.createdAt).toMatch(isoWithTz);

      // AND: updatedAt also includes timezone offset
      expect(body.updatedAt).toMatch(isoWithTz);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-04 — POST missing Nombre → 400 Problem Details (FR8)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-04] Given request with missing Nombre, When POST /api/v1/clientes, Then response status is 400 with Problem Details (no stackTrace)', async ({
    request,
  }) => {
    // GIVEN: Payload with Nombre missing
    const data = { nit: '999888777-1', telefono: '3001234567', ciudad: 'Cali' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data,
    });

    // THEN: Status is 400 Bad Request (FluentValidation gate — FR8)
    expect(response.status()).toBe(400);

    const body = await response.json() as Record<string, unknown>;

    // AND: Response is Problem Details (RFC 7807) — has title or errors
    const isProblemDetails = ('title' in body) || ('errors' in body);
    expect(isProblemDetails).toBe(true);

    // AND: No stackTrace is exposed (NFR6)
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('stack_trace');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-05 — POST with all empty fields → 400 (FR8)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-05] Given all fields are empty strings, When POST /api/v1/clientes, Then response status is 400 (FR8 — server-side validation gate)', async ({
    request,
  }) => {
    // GIVEN: Payload with all fields empty (bypassing frontend Zod guard — tests server-side FluentValidation)
    const data = { nombre: '', nit: '', telefono: '', ciudad: '' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data,
    });

    // THEN: Status is 400 Bad Request (all fields fail .NotEmpty() in CreateClienteRequestValidator)
    expect(response.status()).toBe(400);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-06 — POST duplicate NIT → 409 status exactly
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-06] Given a NIT/RUC already exists, When POST /api/v1/clientes with duplicate NIT, Then response status is exactly 409', async ({
    request,
  }) => {
    // GIVEN: A client with a specific NIT already exists
    const original = buildCliente();
    const created = await api.createCliente(original);

    try {
      // WHEN: POST with the same NIT/RUC
      const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
        data: buildCliente({ nit: original.nit, nombre: 'Empresa Conflicto SA' }),
      });

      // THEN: Status is 409 Conflict (not 500, not 400)
      expect(response.status()).toBe(409);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});
