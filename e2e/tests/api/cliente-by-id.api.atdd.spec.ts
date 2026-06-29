import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.2: Client Detail View — API ATDD (RED phase)
 *
 * Acceptance Criteria covered:
 *   AC #1 — GET /api/v1/clientes/{id} → 200 + ClienteDto (single object, camelCase, nitRuc field)
 *   AC #2 — Non-existent id → 404 + application/problem+json (no internal-detail leakage, NFR6)
 *   AC #3 — Invalid UUID syntax → 400 (route-constraint failure)
 *
 * Aligned test cases (test-design-epic-2.md):
 *   AC-E2.3 (partial — view)
 *   R7      — Deep link to non-existent id graceful 404
 *
 * These tests MUST fail until the backend endpoint MapGet("/{id:guid}") is
 * implemented (Task 1).
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.2 — GET /api/v1/clientes/{id} (RED)', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    for (const id of createdIds) {
      await api.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── AC #1 ──────────────────────────────────────────────────────────────
  test('AC #1 — returns 200 OK and a single ClienteDto (camelCase, nitRuc)', async ({
    request,
  }) => {
    // GIVEN: a known client exists
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(
      buildCliente({
        nombre: 'Detail API Test',
        nit: '900777666',
        telefono: '3004445566',
        ciudad: 'Medellín',
      })
    );
    createdIds.push(cliente.id);

    // WHEN: the developer issues GET /api/v1/clientes/{id}
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`
    );

    // THEN: 200 with application/json and the expected ClienteDto shape
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    // Must be a single object, NOT an array
    expect(Array.isArray(body)).toBe(false);
    expect(body).toMatchObject({
      id: cliente.id,
      nombre: 'Detail API Test',
      nitRuc: '900777666',
      telefono: '3004445566',
      ciudad: 'Medellín',
    });
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  // ─── AC #1 — ISO 8601 timestamps with timezone ──────────────────────────
  test('AC #1 — createdAt/updatedAt are ISO 8601 strings with timezone info', async ({
    request,
  }) => {
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente());
    createdIds.push(cliente.id);

    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`
    );
    const body = await response.json();

    // ISO 8601 with timezone — DateTimeOffset is serialized as `...Z` or `...+00:00`
    expect(body.createdAt).toMatch(/T.*(Z|[+-]\d{2}:\d{2})$/);
    expect(body.updatedAt).toMatch(/T.*(Z|[+-]\d{2}:\d{2})$/);
  });

  // ─── AC #2 ──────────────────────────────────────────────────────────────
  test('AC #2 — non-existent id returns 404 with application/problem+json (RFC 7807)', async ({
    request,
  }) => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${nonExistentId}`
    );

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain(
      'application/problem+json'
    );

    const body = await response.json();
    expect(body).toMatchObject({
      status: 404,
      instance: `/api/v1/clientes/${nonExistentId}`,
    });
    expect(typeof body.title).toBe('string');
    expect(typeof body.type).toBe('string');
    // detail MUST be null (NFR6 — no internal-detail leakage)
    expect(body.detail).toBeNull();
  });

  // ─── AC #2 / NFR6 — no internal detail leakage ─────────────────────────
  test('AC #2 / NFR6 — 404 body does NOT leak entity names, SQL, or internal fields', async ({
    request,
  }) => {
    const nonExistentId = '22222222-2222-2222-2222-222222222222';

    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${nonExistentId}`
    );
    const rawBody = await response.text();

    // Forbidden substrings per NFR6 contract
    expect(rawBody).not.toContain('ClienteEntity');
    expect(rawBody).not.toContain('DbContext');
    expect(rawBody).not.toContain('AppDbContext');
    expect(rawBody).not.toMatch(/at\s+\w+\.\w+/); // no stack-trace-like frames
    expect(rawBody).not.toMatch(/SELECT\s+/i); // no SQL
  });

  // ─── AC #3 ──────────────────────────────────────────────────────────────
  test('AC #3 — syntactically invalid UUID returns 400 (route-constraint failure)', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/not-a-guid`
    );

    // ASP.NET route constraint :guid rejects non-UUID with 400
    expect(response.status()).toBe(400);
  });
});
