import { test, expect } from '@playwright/test';

/**
 * API Integration Tests — Story 2.3: Create Client
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P0-02 — POST /api/v1/clientes creates client (201) and appears in GET
 *   TC-E2-P0-03 — POST /api/v1/clientes empty body → 400 Problem Details (no stackTrace) — NFR6
 *   TC-E2-P0-04 — POST /api/v1/clientes duplicate NIT → 409, Content-Type application/problem+json
 *   TC-E2-P2-05 — CreateClienteRequestValidator rejects empty fields with human-readable messages
 *
 * These tests are in RED phase — they will fail until the backend endpoint is implemented.
 * Tests use Playwright's APIRequestContext (no browser).
 *
 * Note: Full integration tests with xUnit + WebApplicationFactory are also defined in
 *   backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs.
 *   These Playwright API tests verify the contract from the frontend perspective.
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let counter = Date.now();

function buildClientePayload(overrides?: Partial<{
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
}>) {
  const id = `${++counter}`;
  return {
    nombre: `Empresa Test ${id}`,
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-02: POST creates client with 201 and it appears in subsequent GET
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — TC-E2-P0-02: POST /api/v1/clientes creates client (201)', () => {

  test('TC-E2-P0-02 — POST returns HTTP 201 Created with valid body', async ({ request }) => {
    // GIVEN: A valid CreateClienteRequest payload
    const payload = buildClientePayload();

    // WHEN: Sending POST /api/v1/clientes
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: Response is HTTP 201
    expect(response.status()).toBe(201);
  });

  test('TC-E2-P0-02 — POST response body contains id, nombre, nit, telefono, ciudad', async ({ request }) => {
    // GIVEN: A valid CreateClienteRequest payload
    const payload = buildClientePayload();

    // WHEN: Sending POST /api/v1/clientes
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: Response body has the expected shape with submitted fields
    const body = await response.json();
    expect(body).toMatchObject({
      id: expect.any(String),
      nombre: payload.nombre,
      nit: payload.nit,
      telefono: payload.telefono,
      ciudad: payload.ciudad,
    });
  });

  test('TC-E2-P0-02 — POST response body contains a valid UUID as id', async ({ request }) => {
    // GIVEN: A valid CreateClienteRequest payload
    const payload = buildClientePayload();

    // WHEN: Sending POST /api/v1/clientes
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: id is a valid UUID format
    const body = await response.json();
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('TC-E2-P0-02 — newly created client appears in subsequent GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: A valid client created via POST
    const payload = buildClientePayload();
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: payload,
    });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();

    // WHEN: Requesting GET /api/v1/clientes
    const listResp = await request.get(`${API_BASE}/api/v1/clientes`);

    // THEN: The new client is in the list
    const list = await listResp.json();
    const found = list.find((c: { id: string }) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found).toMatchObject({
      nombre: payload.nombre,
      nit: payload.nit,
    });
  });

  test('TC-E2-P0-02 — POST response includes createdAt and updatedAt timestamps', async ({ request }) => {
    // GIVEN: A valid CreateClienteRequest payload
    const payload = buildClientePayload();

    // WHEN: Sending POST /api/v1/clientes
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: Response body contains timestamps
    const body = await response.json();
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
    // Timestamps should be valid ISO strings
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-03: POST with empty body → 400 Problem Details (FluentValidation)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — TC-E2-P0-03: POST empty body → 400 Problem Details', () => {

  test('TC-E2-P0-03 — POST with empty body returns HTTP 400', async ({ request }) => {
    // GIVEN: An empty request body (all required fields missing)

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: Response is HTTP 400
    expect(response.status()).toBe(400);
  });

  test('TC-E2-P0-03 — POST empty body returns Content-Type application/problem+json', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: Content-Type is Problem Details format
    expect(response.headers()['content-type']).toContain('application/problem+json');
  });

  test('TC-E2-P0-03 — POST empty body response contains errors for Nombre field', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: errors object contains a validation error for Nombre
    const body = await response.json();
    expect(body.errors).toBeDefined();
    // FluentValidation field names can be PascalCase or camelCase depending on serialization
    const errorKeys = Object.keys(body.errors).map((k) => k.toLowerCase());
    expect(errorKeys).toContain('nombre');
  });

  test('TC-E2-P0-03 — POST empty body response contains errors for Nit field', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: errors object contains a validation error for Nit
    const body = await response.json();
    const errorKeys = Object.keys(body.errors).map((k) => k.toLowerCase());
    expect(errorKeys).toContain('nit');
  });

  test('TC-E2-P0-03 — POST empty body response contains errors for Telefono field', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: errors object contains a validation error for Telefono
    const body = await response.json();
    const errorKeys = Object.keys(body.errors).map((k) => k.toLowerCase());
    expect(errorKeys).toContain('telefono');
  });

  test('TC-E2-P0-03 — POST empty body response contains errors for Ciudad field', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: errors object contains a validation error for Ciudad
    const body = await response.json();
    const errorKeys = Object.keys(body.errors).map((k) => k.toLowerCase());
    expect(errorKeys).toContain('ciudad');
  });

  test('TC-E2-P0-03 / NFR6 — POST empty body response does NOT contain stackTrace', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: Response body does not contain stackTrace (NFR6: no internal details exposed)
    const rawText = await response.text();
    expect(rawText.toLowerCase()).not.toContain('stacktrace');
    expect(rawText.toLowerCase()).not.toContain('stack_trace');
    expect(rawText.toLowerCase()).not.toContain('exception');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-04: POST duplicate NIT → 409 Conflict
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — TC-E2-P0-04: POST duplicate NIT → 409 Conflict', () => {

  test('TC-E2-P0-04 — POST with duplicate NIT returns HTTP 409 Conflict', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const payload = buildClientePayload({ nit: '900-ATDD-DUP-001' });
    // Create the first client
    await request.post(`${API_BASE}/api/v1/clientes`, { data: payload });

    // WHEN: Sending POST with the same NIT again
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: buildClientePayload({ nit: payload.nit }),
    });

    // THEN: Response is HTTP 409 Conflict
    expect(response.status()).toBe(409);
  });

  test('TC-E2-P0-04 — duplicate NIT response has Content-Type application/problem+json', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const payload = buildClientePayload({ nit: '900-ATDD-DUP-002' });
    await request.post(`${API_BASE}/api/v1/clientes`, { data: payload });

    // WHEN: Sending POST with the same NIT again
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: buildClientePayload({ nit: payload.nit }),
    });

    // THEN: Content-Type is Problem Details format
    expect(response.headers()['content-type']).toContain('application/problem+json');
  });

  test('TC-E2-P0-04 — duplicate NIT response body contains human-readable detail message', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const payload = buildClientePayload({ nit: '900-ATDD-DUP-003' });
    await request.post(`${API_BASE}/api/v1/clientes`, { data: payload });

    // WHEN: Sending POST with the same NIT again
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: buildClientePayload({ nit: payload.nit }),
    });

    // THEN: Response body detail contains a human-readable message (not SQL/stack trace)
    const body = await response.json();
    expect(body.detail).toBeDefined();
    expect(typeof body.detail).toBe('string');
    expect(body.detail.length).toBeGreaterThan(0);
  });

  test('TC-E2-P0-04 — duplicate NIT response detail contains "NIT" or human-readable reference', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const payload = buildClientePayload({ nit: '900-ATDD-DUP-004' });
    await request.post(`${API_BASE}/api/v1/clientes`, { data: payload });

    // WHEN: Sending POST with the same NIT again
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: buildClientePayload({ nit: payload.nit }),
    });

    // THEN: detail message is human-readable and references the duplicate NIT
    const body = await response.json();
    // The architecture spec mandates: detail = "El NIT/RUC ya está registrado"
    expect(body.detail).toContain('NIT');
  });

  test('TC-E2-P0-04 / NFR6 — duplicate NIT response does NOT contain stackTrace', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const payload = buildClientePayload({ nit: '900-ATDD-DUP-005' });
    await request.post(`${API_BASE}/api/v1/clientes`, { data: payload });

    // WHEN: Sending POST with the same NIT again
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: buildClientePayload({ nit: payload.nit }),
    });

    // THEN: Raw error details are not exposed (NFR6)
    const rawText = await response.text();
    expect(rawText.toLowerCase()).not.toContain('stacktrace');
    expect(rawText.toLowerCase()).not.toContain('stack_trace');
    expect(rawText.toLowerCase()).not.toContain('dbupdateexception');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-05: CreateClienteRequestValidator — all required fields must be present
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — TC-E2-P2-05: FluentValidation error messages are human-readable', () => {

  test('TC-E2-P2-05 — validation error messages for Nombre are human-readable (not code/identifier)', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: The Nombre field error message is human-readable Spanish text
    const body = await response.json();
    const allErrors = Object.values(body.errors).flat() as string[];
    // At least one error message should be a human-readable string (not null, empty, or code)
    expect(allErrors.some((msg) => msg.length > 5)).toBe(true);
  });

  test('TC-E2-P2-05 — all four fields produce at least one error when request is empty', async ({ request }) => {
    // GIVEN: An empty request body

    // WHEN: Sending POST /api/v1/clientes with empty body
    const response = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {},
    });

    // THEN: There are exactly 4 field error groups (one per required field)
    const body = await response.json();
    const errorKeys = Object.keys(body.errors).map((k) => k.toLowerCase());
    // All four required fields must have errors
    expect(errorKeys).toContain('nombre');
    expect(errorKeys).toContain('nit');
    expect(errorKeys).toContain('telefono');
    expect(errorKeys).toContain('ciudad');
  });
});
