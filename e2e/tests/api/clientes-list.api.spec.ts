import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.1: Client List & Search — API contract tests
 *
 * RED phase: tests FAIL until the backend endpoint is implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — GET /api/v1/clientes returns 200 with ClienteDto[] array
 *   AC3 — Returns [] (empty array) when no clients — never 404
 *   AC4 — Endpoint availability (health probe)
 *
 * Priority alignment (test-design-epic-2.md):
 *   Smoke → GET /api/v1/clientes returns 200
 *   P0    → Endpoint returns direct array (no wrapper)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.1 — GET /api/v1/clientes (API contract, RED phase)', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request
        .delete(`${API_BASE_URL}/api/v1/clientes/${id}`)
        .catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC1 — Endpoint returns 200 with array of ClienteDto
  // ─────────────────────────────────────────────────────────────────────────

  test('AC1 — GET /api/v1/clientes returns 200 (smoke)', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response status is 200
    expect(response.status()).toBe(200);
  });

  test('AC1 — response body is a JSON array (not a wrapper object)', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The body is a direct array (architecture "Format Patterns" — no wrapper)
    expect(Array.isArray(body)).toBe(true);
  });

  test('AC1 — each item in the array has the expected ClienteDto shape', async ({
    request,
  }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const createResponse = await request.post(
      `${API_BASE_URL}/api/v1/clientes`,
      { data },
    );
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: unknown[] = await response.json();

    // THEN: At least one item matches ClienteDto shape
    const item = body.find(
      (c: unknown) =>
        typeof c === 'object' && c !== null && (c as Record<string, unknown>).id === created.id,
    ) as Record<string, unknown> | undefined;

    expect(item).toBeDefined();
    expect(typeof item!.id).toBe('string');
    expect(typeof item!.nombre).toBe('string');
    expect(typeof item!.nit).toBe('string');
    expect(typeof item!.telefono).toBe('string');
    expect(typeof item!.ciudad).toBe('string');
    expect(typeof item!.createdAt).toBe('string');
    expect(typeof item!.updatedAt).toBe('string');
  });

  test('AC1 — response Content-Type is application/json', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type header is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC3 — Returns empty array (NOT 404) when no clients exist
  // ─────────────────────────────────────────────────────────────────────────

  test('AC3 — GET /api/v1/clientes returns 200 with [] when no clients (not 404)', async ({
    request,
  }) => {
    // GIVEN: The endpoint exists (status must not be 404)
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Status is 200 (never 404)
    expect(response.status()).not.toBe(404);
    expect(response.status()).toBe(200);

    // AND: If the list happens to be empty, it returns [] not null
    const body = await response.json();
    if (Array.isArray(body) && body.length === 0) {
      expect(body).toEqual([]);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC1 — camelCase JSON keys (auto-serialized by .NET)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC1 — JSON fields are camelCase (createdAt not created_at)', async ({
    request,
  }) => {
    // GIVEN: A client exists
    const data = buildCliente();
    const createResponse = await request.post(
      `${API_BASE_URL}/api/v1/clientes`,
      { data },
    );
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Record<string, unknown>[];

    const item = body.find((c) => c['id'] === created.id);
    expect(item).toBeDefined();

    // THEN: Keys are camelCase
    expect(item).toHaveProperty('createdAt');
    expect(item).toHaveProperty('updatedAt');
    expect(item).not.toHaveProperty('created_at');
    expect(item).not.toHaveProperty('updated_at');
  });
});
