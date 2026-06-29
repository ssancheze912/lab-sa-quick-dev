import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.3: Create Client — API ATDD (RED phase)
 *
 * Acceptance Criteria covered:
 *   AC #1 — POST /api/v1/clientes returns 201 + ClienteDto (camelCase, nitRuc, ISO 8601 timestamps),
 *           with Location header pointing to /api/v1/clientes/{newId}, and the new row is persisted.
 *   AC #2 — Empty / partial / oversized payloads → 400 + application/problem+json (RFC 7807),
 *           errors dictionary keyed by camelCase field names; no internal-detail leakage (NFR6).
 *   AC #3 — Duplicate NIT → 409 + application/problem+json with safe Spanish detail;
 *           no Postgres SQLSTATE / DbUpdateException / unique-index name leaked (NFR6).
 *
 * Aligned test cases (test-design-epic-2.md):
 *   TC-E2-P0-01 (API leg) — Create Client Happy Path
 *   TC-E2-P0-02 (API leg) — Validation 400 + Problem Details
 *   TC-E2-P0-03 (API leg) — Duplicate NIT 409 + Problem Details
 *
 * Risks covered: R2 (duplicate NIT), R4 (required-field validation), NFR6 (leakage scan).
 *
 * These tests MUST fail until the backend endpoint
 * `MapPost("/api/v1/clientes", ...)` plus `CreateClienteCommand`,
 * `CreateClienteCommandHandler`, `ClienteValidator`, and `DuplicateNitException`
 * are implemented (Tasks 1, 2, 3).
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.3 — POST /api/v1/clientes (RED)', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    for (const id of createdIds) {
      await api.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── AC #1 / TC-E2-P0-01 — Happy path ─────────────────────────────────────
  test('AC #1 — returns 201 + ClienteDto + Location header when all fields valid', async ({
    request,
  }) => {
    // GIVEN: a fresh, valid create-payload
    const payload = {
      nombre: 'ACME Create SAS',
      nitRuc: '900111222-3',
      telefono: '3001112233',
      ciudad: 'Bogotá',
    };

    // WHEN: POST /api/v1/clientes with JSON body
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    });

    // THEN: 201 Created with application/json
    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // Body matches the ClienteDto contract (camelCase, nitRuc, ISO 8601)
    expect(Array.isArray(body)).toBe(false);
    expect(body).toMatchObject({
      nombre: 'ACME Create SAS',
      nitRuc: '900111222-3',
      telefono: '3001112233',
      ciudad: 'Bogotá',
    });
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
    expect(body.createdAt).toMatch(/T.*(Z|[+-]\d{2}:\d{2})$/);

    // Location header points to the new resource
    const location = response.headers()['location'];
    expect(location).toBeDefined();
    expect(location).toContain(`/api/v1/clientes/${body.id}`);
  });

  // ─── AC #1 — createdAt and updatedAt equal on creation ────────────────────
  test('AC #1 — createdAt equals updatedAt on first insert', async ({ request }) => {
    // GIVEN: a fresh valid payload
    const payload = buildCliente({ nit: '900111223-4' });

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: payload.nombre, nitRuc: payload.nit, telefono: payload.telefono, ciudad: payload.ciudad },
    });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: createdAt === updatedAt within 1 ms tolerance
    expect(response.status()).toBe(201);
    const created = new Date(body.createdAt).getTime();
    const updated = new Date(body.updatedAt).getTime();
    expect(Math.abs(updated - created)).toBeLessThanOrEqual(1);
  });

  // ─── AC #1 — Persisted: subsequent GET by id returns 200 with same row ────
  test('AC #1 — new row is persisted and retrievable via GET /api/v1/clientes/{id}', async ({
    request,
  }) => {
    // GIVEN: a created client
    const payload = buildCliente({ nit: '900111224-5' });
    const create = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: payload.nombre, nitRuc: payload.nit, telefono: payload.telefono, ciudad: payload.ciudad },
    });
    const created = await create.json();
    if (created?.id) createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{newId}
    const fetched = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN: 200 with the same id and fields
    expect(fetched.status()).toBe(200);
    const body = await fetched.json();
    expect(body).toMatchObject({
      id: created.id,
      nombre: payload.nombre,
      nitRuc: payload.nit,
      telefono: payload.telefono,
      ciudad: payload.ciudad,
    });
  });

  // ─── AC #1 — New id appears in GET /api/v1/clientes ───────────────────────
  test('AC #1 — new id appears in GET /api/v1/clientes list', async ({ request }) => {
    // GIVEN: a created client
    const payload = buildCliente({ nit: '900111225-6' });
    const create = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: payload.nombre, nitRuc: payload.nit, telefono: payload.telefono, ciudad: payload.ciudad },
    });
    const created = await create.json();
    if (created?.id) createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes
    const list = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: the new id is in the returned array
    expect(list.status()).toBe(200);
    const items = await list.json();
    expect(Array.isArray(items)).toBe(true);
    const ids = items.map((c: { id: string }) => c.id);
    expect(ids).toContain(created.id);
  });

  // ─── AC #2 / TC-E2-P0-02 — Empty body → 400 + Problem Details ─────────────
  test('AC #2 — empty body returns 400 with application/problem+json and 4 errors keys', async ({
    request,
  }) => {
    // WHEN: POST /api/v1/clientes with {}
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {},
    });

    // THEN: 400 + application/problem+json + errors dictionary
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/problem+json');

    const body = await response.json();
    expect(body.status).toBe(400);
    expect(body.errors).toBeDefined();
    // Errors keyed by camelCase field names (FluentValidation property name → lowercased first char)
    expect(body.errors).toHaveProperty('nombre');
    expect(body.errors).toHaveProperty('nitRuc');
    expect(body.errors).toHaveProperty('telefono');
    expect(body.errors).toHaveProperty('ciudad');
    // Each entry is a non-empty array of Spanish messages
    expect(Array.isArray(body.errors.nombre)).toBe(true);
    expect(body.errors.nombre.length).toBeGreaterThan(0);
  });

  // ─── AC #2 / NFR6 — 400 body does NOT leak internals ──────────────────────
  test('AC #2 / NFR6 — 400 body does NOT contain entity / DbContext / SQL / Nit internal field', async ({
    request,
  }) => {
    // WHEN: POST /api/v1/clientes with {}
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: {} });
    const rawBody = await response.text();

    // THEN: forbidden substrings per NFR6 contract
    expect(rawBody).not.toContain('ClienteEntity');
    expect(rawBody).not.toContain('DbContext');
    expect(rawBody).not.toContain('AppDbContext');
    expect(rawBody).not.toContain('"Nit"');
    expect(rawBody).not.toMatch(/at\s+\w+\.\w+/);
    expect(rawBody).not.toMatch(/SELECT\s+/i);
  });

  // ─── AC #2 — Each single missing field is reported ────────────────────────
  for (const missingField of ['nombre', 'nitRuc', 'telefono', 'ciudad'] as const) {
    test(`AC #2 — omitting "${missingField}" returns 400 with that field in errors`, async ({
      request,
    }) => {
      // GIVEN: an otherwise-valid payload with one field missing
      const all = { nombre: 'Some Nombre', nitRuc: '999000111', telefono: '3001234567', ciudad: 'Cali' };
      const payload: Record<string, string> = { ...all };
      delete payload[missingField];

      // WHEN: POST /api/v1/clientes
      const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

      // THEN: 400 + errors map contains the missing field
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.errors).toHaveProperty(missingField);
      expect(body.errors[missingField].length).toBeGreaterThan(0);
    });
  }

  // ─── AC #3 / TC-E2-P0-03 — Duplicate NIT → 409 + safe Problem Details ─────
  test('AC #3 — duplicate nitRuc returns 409 with safe Spanish detail', async ({ request }) => {
    // GIVEN: a first client is created with a specific nitRuc
    const dupNit = '909009009-D';
    const first = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'First Cliente', nitRuc: dupNit, telefono: '3001110000', ciudad: 'Cali' },
    });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();
    if (firstBody?.id) createdIds.push(firstBody.id);

    // WHEN: a second POST with the SAME nitRuc (different nombre)
    const second = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Second Cliente', nitRuc: dupNit, telefono: '3001110001', ciudad: 'Medellín' },
    });

    // THEN: 409 + application/problem+json with the user-safe detail
    expect(second.status()).toBe(409);
    expect(second.headers()['content-type']).toContain('application/problem+json');

    const body = await second.json();
    expect(body.status).toBe(409);
    expect(body.title).toBe('NIT/RUC duplicado');
    expect(body.detail).toBe('El NIT/RUC ya está registrado');
    expect(body.instance).toBe('/api/v1/clientes');
    expect(body.type).toBe('https://tools.ietf.org/html/rfc7231#section-6.5.8');
  });

  // ─── AC #3 / NFR6 — 409 body does NOT leak SQL / EF internals ─────────────
  test('AC #3 / NFR6 — 409 body does NOT contain 23505 / DbUpdateException / uk_clientes_nit / SQL', async ({
    request,
  }) => {
    // GIVEN: a seeded client
    const dupNit = '909009010-E';
    const first = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Seed Cliente', nitRuc: dupNit, telefono: '3009990001', ciudad: 'Cali' },
    });
    const firstBody = await first.json();
    if (firstBody?.id) createdIds.push(firstBody.id);

    // WHEN: a second POST with the same nitRuc
    const second = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Dup Cliente', nitRuc: dupNit, telefono: '3009990002', ciudad: 'Bogotá' },
    });
    const rawBody = await second.text();

    // THEN: NFR6 forbidden substrings absent
    expect(rawBody).not.toContain('23505');
    expect(rawBody).not.toContain('DbUpdateException');
    expect(rawBody).not.toContain('uk_clientes_nit');
    expect(rawBody).not.toContain('ClienteEntity');
    expect(rawBody).not.toMatch(/SELECT\s+/i);
    expect(rawBody).not.toMatch(/at\s+\w+\.\w+/);
  });

  // ─── AC #3 — Duplicate row is NOT persisted ───────────────────────────────
  test('AC #3 — duplicate POST does NOT create a second row in the database', async ({
    request,
  }) => {
    // GIVEN: a first client is created
    const dupNit = '909009011-F';
    const first = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Original', nitRuc: dupNit, telefono: '3008880001', ciudad: 'Bogotá' },
    });
    const firstBody = await first.json();
    if (firstBody?.id) createdIds.push(firstBody.id);

    // Count clients with that nitRuc BEFORE the duplicate POST
    const listBefore = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const itemsBefore = await listBefore.json();
    const dupCountBefore = itemsBefore.filter(
      (c: { nitRuc: string }) => c.nitRuc === dupNit,
    ).length;
    expect(dupCountBefore).toBe(1);

    // WHEN: a second POST with the same nitRuc
    await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Duplicate', nitRuc: dupNit, telefono: '3008880002', ciudad: 'Cali' },
    });

    // THEN: still only one row with that nitRuc
    const listAfter = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const itemsAfter = await listAfter.json();
    const dupCountAfter = itemsAfter.filter(
      (c: { nitRuc: string }) => c.nitRuc === dupNit,
    ).length;
    expect(dupCountAfter).toBe(1);
  });
});
