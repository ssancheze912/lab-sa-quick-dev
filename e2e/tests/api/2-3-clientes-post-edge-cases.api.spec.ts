/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * API Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with API-level edge cases not covered in
 * 2-3-clientes-post.api.spec.ts.
 *
 * New Test Cases:
 *   TC-2.3-A-07 — POST valid payload → Content-Type is application/json
 *   TC-2.3-A-08 — POST valid payload → Location header points to the new resource
 *   TC-2.3-A-09 — POST valid payload → updatedAt equals createdAt at creation time
 *   TC-2.3-A-10 — POST with whitespace-only Nombre → 400 (FluentValidation .NotEmpty() trims whitespace)
 *   TC-2.3-A-11 — POST with Nombre at maximum length (200 chars) → 201 Created
 *   TC-2.3-A-12 — POST with Nombre exceeding maximum length (201 chars) → 400 Bad Request
 *   TC-2.3-A-13 — POST with NIT at maximum length (50 chars) → 201 Created
 *   TC-2.3-A-14 — POST with NIT exceeding maximum length (51 chars) → 400 Bad Request
 *   TC-2.3-A-15 — POST 409 response Content-Type is problem+json or application/json
 *   TC-2.3-A-16 — POST valid payload → response body has no unexpected/leaked fields
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('POST /api/v1/clientes — API edge cases (Story 2.3)', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-07 — POST valid payload → Content-Type is application/json
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-07] Given valid client data, When POST /api/v1/clientes, Then Content-Type header is application/json', async ({
    request,
  }) => {
    const data = buildCliente({ nombre: 'ContentType Check SA' });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, unknown>;
      createdId = body.id as string ?? null;

      expect(response.status()).toBe(201);

      // THEN: Content-Type is application/json
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/application\/json/i);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-08 — POST valid payload → Location header points to new resource
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-08] Given valid client data, When POST /api/v1/clientes, Then Location header points to the created resource URL', async ({
    request,
  }) => {
    const data = buildCliente({ nombre: 'Location Header SA' });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, string>;
      createdId = body.id ?? null;

      expect(response.status()).toBe(201);

      // THEN: A Location header is present pointing to /api/v1/clientes/{id}
      const location = response.headers()['location'];
      expect(location).toBeTruthy();
      expect(location).toContain('/api/v1/clientes/');
      if (createdId) {
        expect(location).toContain(createdId);
      }
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-09 — POST valid payload → updatedAt equals createdAt at creation
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-09] Given valid client data, When POST /api/v1/clientes, Then updatedAt equals createdAt at the moment of creation', async ({
    request,
  }) => {
    const data = buildCliente({ nombre: 'Timestamp Equality SA' });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, string>;
      createdId = body.id ?? null;

      expect(response.status()).toBe(201);

      // THEN: updatedAt equals createdAt at creation time (factory sets both to UtcNow)
      const createdAtMs = new Date(body.createdAt).getTime();
      const updatedAtMs = new Date(body.updatedAt).getTime();

      expect(Number.isNaN(createdAtMs)).toBe(false);
      expect(Number.isNaN(updatedAtMs)).toBe(false);
      // Allow a 1-second tolerance for timestamp resolution differences
      expect(Math.abs(updatedAtMs - createdAtMs)).toBeLessThanOrEqual(1000);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-10 — POST with whitespace-only Nombre → 400 (FluentValidation)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.3-A-10] Given Nombre is whitespace-only, When POST /api/v1/clientes, Then response is 400 (FluentValidation .NotEmpty() considers whitespace as empty)', async ({
    request,
  }) => {
    // GIVEN: Payload with whitespace-only Nombre (bypasses Zod on frontend — tests server gate)
    const data = { nombre: '   ', nit: '888777666-5', telefono: '3001234567', ciudad: 'Cali' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Status is 400 Bad Request (FluentValidation .NotEmpty() returns false for whitespace)
    expect(response.status()).toBe(400);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-11 — POST with Nombre at maximum length (200 chars) → 201 Created
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-11] Given Nombre is exactly 200 characters, When POST /api/v1/clientes, Then response is 201 Created (boundary — MaximumLength(200))', async ({
    request,
  }) => {
    // GIVEN: Nombre at exactly the 200-character boundary
    const nombreMax200 = 'A'.repeat(200);
    const data = buildCliente({ nombre: nombreMax200 });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, string>;
      createdId = body.id ?? null;

      // THEN: Status is 201 Created (exactly at boundary = valid)
      expect(response.status()).toBe(201);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-12 — POST with Nombre > 200 chars → 400 Bad Request
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-12] Given Nombre is 201 characters, When POST /api/v1/clientes, Then response is 400 Bad Request (exceeds MaximumLength(200))', async ({
    request,
  }) => {
    // GIVEN: Nombre one character over the 200-character limit
    const nombreOver200 = 'A'.repeat(201);
    const data = buildCliente({ nombre: nombreOver200 });

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Status is 400 Bad Request (exceeds MaximumLength(200))
    expect(response.status()).toBe(400);

    const body = await response.json() as Record<string, unknown>;
    // AND: No stackTrace is exposed (NFR6)
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('stack_trace');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-13 — POST with NIT at maximum length (50 chars) → 201 Created
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-13] Given NIT is exactly 50 characters, When POST /api/v1/clientes, Then response is 201 Created (boundary — MaximumLength(50))', async ({
    request,
  }) => {
    // GIVEN: NIT at exactly the 50-character boundary (unique value to avoid duplicate)
    const nitMax50 = `N${Date.now()}`.slice(0, 50).padEnd(50, '0');
    const data = buildCliente({ nit: nitMax50 });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, string>;
      createdId = body.id ?? null;

      // THEN: Status is 201 Created (exactly at boundary = valid)
      expect(response.status()).toBe(201);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-14 — POST with NIT > 50 chars → 400 Bad Request
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.3-A-14] Given NIT is 51 characters, When POST /api/v1/clientes, Then response is 400 Bad Request (exceeds MaximumLength(50))', async ({
    request,
  }) => {
    // GIVEN: NIT one character over the 50-character limit
    const nitOver50 = 'N'.repeat(51);
    const data = buildCliente({ nit: nitOver50 });

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Status is 400 Bad Request (exceeds MaximumLength(50))
    expect(response.status()).toBe(400);

    const body = await response.json() as Record<string, unknown>;
    // AND: No stackTrace is exposed (NFR6)
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('stack_trace');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-15 — POST 409 response Content-Type is problem+json or application/json
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.3-A-15] Given a duplicate NIT, When POST /api/v1/clientes returns 409, Then Content-Type is problem+json or application/json (RFC 7807)', async ({
    request,
  }) => {
    // GIVEN: A client with a specific NIT already exists
    const original = buildCliente();
    const created = await api.createCliente(original);

    try {
      // WHEN: POST with the same NIT/RUC
      const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
        data: buildCliente({ nit: original.nit, nombre: 'ContentType 409 SA' }),
      });

      expect(response.status()).toBe(409);

      // THEN: Content-Type is problem+json (RFC 7807 preferred) or application/json (acceptable)
      const contentType = response.headers()['content-type'] ?? '';
      const isProblemJson = /application\/problem\+json/i.test(contentType);
      const isApplicationJson = /application\/json/i.test(contentType);
      expect(isProblemJson || isApplicationJson).toBe(true);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.3-A-16 — POST valid payload → no unexpected/leaked fields in response
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.3-A-16] Given valid client data, When POST /api/v1/clientes returns 201, Then response body has only the expected DTO fields (no leaked internal properties)', async ({
    request,
  }) => {
    const data = buildCliente({ nombre: 'No Leak Post SA' });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    let createdId: string | null = null;
    try {
      const body = await response.json() as Record<string, unknown>;
      createdId = body.id as string ?? null;

      expect(response.status()).toBe(201);

      // THEN: Response contains only the expected ClienteDto fields
      const expectedKeys = new Set(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt']);
      const unexpectedKeys = Object.keys(body).filter((k) => !expectedKeys.has(k));

      // No unexpected fields (no passwordHash, internalNotes, stackTrace, domainEvents, etc.)
      expect(unexpectedKeys).toHaveLength(0);
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });
});
