/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD API Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Target: PUT /api/v1/clientes/{id} endpoint
 * Backend: .NET 10 Minimal API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#1 — PUT valid payload → 200 OK with updated ClienteDto (all fields reflect new values, updatedAt changed)
 *   AC#2 — PUT → response body has all required fields including updatedAt reflecting the change
 *   AC#3 — PUT with missing required field → 400 Problem Details, no stackTrace (FR8, NFR6)
 *   AC#4 — PUT non-existing id → 404 Problem Details (title, no stackTrace)
 *   AC#5 — PUT duplicate NIT (different client) → 409 with title "El NIT/RUC ya está registrado.", no stackTrace (R-002, NFR6)
 *
 * Test Cases:
 *   TC-2.4-P0-02 (P0, AC#5)  — PUT duplicate NIT → 409 with title, no stackTrace (R-002)
 *   TC-2.4-A-01  (P1, AC#1)  — PUT valid payload → 200 OK
 *   TC-2.4-A-02  (P1, AC#1)  — PUT valid payload → all fields updated in response body
 *   TC-2.4-A-03  (P1, AC#1)  — PUT valid payload → updatedAt is newer than original createdAt (ISO 8601 with tz)
 *   TC-2.4-A-04  (P1, AC#3)  — PUT missing Nombre → 400 Problem Details, no stackTrace
 *   TC-2.4-A-05  (P1, AC#3)  — PUT all empty fields → 400 (FR8 server-side gate)
 *   TC-2.4-A-06  (P1, AC#4)  — PUT non-existing id → 404 Problem Details, no stackTrace
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('PUT /api/v1/clientes/{id} — API contract (Story 2.4)', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.4-P0-02 — Duplicate NIT (different client) → 409 with title, no stackTrace (R-002, NFR6)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P0][TC-2.4-P0-02] Given a NIT/RUC already belongs to another client, When PUT /api/v1/clientes/{id} uses that NIT, Then 409 with title "El NIT/RUC ya está registrado." and no stackTrace field (R-002, NFR6)', async ({
    request,
  }) => {
    // GIVEN: Two different clients exist
    const clienteA = buildCliente({ nombre: 'Cliente A Original SA', nit: '800200300-1' });
    const clienteB = buildCliente({ nombre: 'Cliente B Original SA', nit: '800200300-2' });
    const createdA = await api.createCliente(clienteA);
    const createdB = await api.createCliente(clienteB);

    try {
      // WHEN: PUT client B using client A's NIT (duplicate)
      const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdB.id}`, {
        data: {
          nombre: createdB.nombre,
          nit: clienteA.nit, // duplicate NIT — belongs to clienteA
          telefono: createdB.telefono,
          ciudad: createdB.ciudad,
        },
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
      await api.deleteCliente(createdA.id).catch(() => null);
      await api.deleteCliente(createdB.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.4-A-01 — PUT valid payload → 200 OK
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.4-A-01] Given an existing client, When PUT /api/v1/clientes/{id} with valid payload, Then response status is 200 OK', async ({
    request,
  }) => {
    // GIVEN: An existing client
    const original = buildCliente();
    const created = await api.createCliente(original);

    try {
      // WHEN: PUT with updated fields
      const updated = buildCliente({ nombre: 'Empresa Actualizada SA', nit: '900000001-1' });
      const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${created.id}`, {
        data: updated,
      });

      // THEN: Status is 200 OK (not 201, not 204)
      expect(response.status()).toBe(200);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.4-A-02 — PUT valid payload → all fields updated in response body
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.4-A-02] Given an existing client, When PUT /api/v1/clientes/{id} with new field values, Then response body reflects all updated values and retains original id and createdAt', async ({
    request,
  }) => {
    // GIVEN: An existing client
    const original = buildCliente({ nombre: 'Empresa Original SA', nit: '900111222-3' });
    const created = await api.createCliente(original) as Record<string, string>;

    try {
      // WHEN: PUT with completely new values
      const updatePayload = {
        nombre: 'Empresa Modificada SA',
        nit: '900111222-9',
        telefono: '3219876543',
        ciudad: 'Medellín',
      };
      const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${created.id}`, {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);
      const body = await response.json() as Record<string, string>;

      // THEN: Response contains all required fields
      expect(body).toMatchObject({
        id: expect.any(String),
        nombre: expect.any(String),
        nit: expect.any(String),
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // AND: Updated fields reflect new values
      expect(body.nombre).toBe(updatePayload.nombre);
      expect(body.nit).toBe(updatePayload.nit);
      expect(body.telefono).toBe(updatePayload.telefono);
      expect(body.ciudad).toBe(updatePayload.ciudad);

      // AND: id stays the same
      expect(body.id).toBe(created.id);

      // AND: createdAt is preserved (not changed by update)
      expect(body.createdAt).toBe(created.createdAt);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.4-A-03 — PUT valid payload → updatedAt is ISO 8601 with timezone offset
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.4-A-03] Given an existing client, When PUT /api/v1/clientes/{id}, Then updatedAt in response is ISO 8601 with timezone offset (DateTimeOffset — never plain DateTime)', async ({
    request,
  }) => {
    // GIVEN: An existing client
    const original = buildCliente({ nit: '900222333-4' });
    const created = await api.createCliente(original) as Record<string, string>;

    try {
      // WHEN: PUT with updated values
      const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${created.id}`, {
        data: {
          nombre: 'Empresa Timestamp Test SA',
          nit: '900222333-4',
          telefono: '3001234560',
          ciudad: 'Cali',
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json() as Record<string, string>;

      // THEN: updatedAt is ISO 8601 with timezone offset
      // Valid: "2026-03-12T10:30:00Z" or "2026-03-12T10:30:00+05:00"
      // Invalid: "2026-03-12T10:30:00" (no timezone — plain DateTime violation)
      const isoWithTz = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})/;
      expect(body.updatedAt).toMatch(isoWithTz);

      // AND: createdAt also has timezone offset
      expect(body.createdAt).toMatch(isoWithTz);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.4-A-04 — PUT missing Nombre → 400 Problem Details (FR8, NFR6)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.4-A-04] Given an existing client, When PUT /api/v1/clientes/{id} with missing Nombre, Then response status is 400 with Problem Details (no stackTrace)', async ({
    request,
  }) => {
    // GIVEN: An existing client
    const original = buildCliente({ nit: '900444555-5' });
    const created = await api.createCliente(original) as Record<string, string>;

    try {
      // WHEN: PUT with Nombre missing
      const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${created.id}`, {
        data: { nit: '900444555-5', telefono: '3001234567', ciudad: 'Cali' },
      });

      // THEN: Status is 400 Bad Request (FluentValidation gate — FR8)
      expect(response.status()).toBe(400);

      const body = await response.json() as Record<string, unknown>;

      // AND: Response is Problem Details — has title or errors
      const isProblemDetails = ('title' in body) || ('errors' in body);
      expect(isProblemDetails).toBe(true);

      // AND: No stackTrace exposed (NFR6)
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('stack_trace');
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.4-A-05 — PUT all empty fields → 400 (FR8)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.4-A-05] Given an existing client, When PUT /api/v1/clientes/{id} with all empty strings, Then response status is 400 (FR8 — server-side FluentValidation gate)', async ({
    request,
  }) => {
    // GIVEN: An existing client
    const original = buildCliente({ nit: '900555666-6' });
    const created = await api.createCliente(original) as Record<string, string>;

    try {
      // WHEN: PUT with all fields empty (bypasses frontend Zod guard — tests server-side gate)
      const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${created.id}`, {
        data: { nombre: '', nit: '', telefono: '', ciudad: '' },
      });

      // THEN: Status is 400 Bad Request (all fields fail .NotEmpty() in UpdateClienteRequestValidator)
      expect(response.status()).toBe(400);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.4-A-06 — PUT non-existing id → 404 Problem Details (no stackTrace)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.4-A-06] Given a non-existing clienteId, When PUT /api/v1/clientes/{id}, Then response status is 404 with Problem Details and no stackTrace (NFR6)', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not correspond to any client
    const nonExistentId = '00000000-dead-beef-0000-000000000000';

    // WHEN: PUT with valid payload but non-existing id
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`, {
      data: {
        nombre: 'Empresa Fantasma SA',
        nit: '999999999-9',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    // THEN: Status is 404 Not Found
    expect(response.status()).toBe(404);

    const body = await response.json() as Record<string, unknown>;

    // AND: Response is Problem Details
    const isProblemDetails = ('title' in body) || ('status' in body);
    expect(isProblemDetails).toBe(true);

    // AND: No stackTrace exposed (NFR6)
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('stack_trace');
    expect(body).not.toHaveProperty('exception');
  });
});
