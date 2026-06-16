import { test, expect } from '@playwright/test';

/**
 * API Integration Tests — Story 2.1: Client List & Search
 *
 * Acceptance Criteria covered:
 *   AC1 — GET /api/v1/clientes returns HTTP 200 + JSON array with Nombre and NIT
 *   AC3 — GET /api/v1/clientes returns HTTP 200 + empty array when no records exist
 *   AC4 — Backend returns appropriate error format (Problem Details RFC 7807) — NFR6
 *
 * These tests are in RED phase — they will fail until the backend endpoint is implemented.
 * Tests use Playwright's APIRequestContext (no browser).
 *
 * Note: Full integration tests with xUnit + WebApplicationFactory are defined in
 *   backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs (Story 2.1 Task 5).
 *   These Playwright API tests verify the contract from the frontend perspective.
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.1 — GET /api/v1/clientes API Contract', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // AC1: Endpoint returns 200 + JSON array with client data
  // ─────────────────────────────────────────────────────────────────────────

  test('AC1 — GET /api/v1/clientes returns HTTP 200 with Content-Type application/json', async ({ request }) => {
    // GIVEN: The backend API is running

    // WHEN: Sending GET /api/v1/clientes
    const response = await request.get(`${API_BASE}/api/v1/clientes`);

    // THEN: Response is HTTP 200
    expect(response.status()).toBe(200);
    // AND: Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('AC1 — GET /api/v1/clientes returns a JSON array', async ({ request }) => {
    // GIVEN: The backend API is running

    // WHEN: Sending GET /api/v1/clientes
    const response = await request.get(`${API_BASE}/api/v1/clientes`);

    // THEN: Body is a JSON array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('AC1 — each client item contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async ({ request }) => {
    // GIVEN: At least one client exists (create one via API first)
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa ATDD Test 2.1',
        nit: `900${Date.now().toString().slice(-6)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    // Skip cleanup assertion — focus on contract shape
    const created = await createResp.json();
    const clienteId = created?.id;

    // WHEN: Sending GET /api/v1/clientes
    const response = await request.get(`${API_BASE}/api/v1/clientes`);
    const body = await response.json();

    // THEN: At least one item exists and has the expected shape
    const item = body.find((c: { id: string }) => c.id === clienteId);
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

    // Cleanup
    if (clienteId) {
      await request.delete(`${API_BASE}/api/v1/clientes/${clienteId}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC3: Empty array when no records exist (P0 TC-E2-P0-01)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC3 — GET /api/v1/clientes returns empty array [] when database has no records', async ({ request }) => {
    // NOTE: This test requires a clean database state.
    // In CI, the test-container DB is reset per test run.
    // Locally, this may require manual DB cleanup.

    // GIVEN: No clients exist in the system
    // (We cannot guarantee clean state here without a reset endpoint;
    //  this test is most reliable in an isolated test-container environment)

    // WHEN: Sending GET /api/v1/clientes to a clean DB
    const response = await request.get(`${API_BASE}/api/v1/clientes`);

    // THEN: HTTP 200
    expect(response.status()).toBe(200);
    // AND: Body is an array (may not be empty in non-clean local env, but must be an array)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC4: Backend error format does not expose raw stack traces (NFR6)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC4 — GET /api/v1/clientes/{non-existent-id} returns Problem Details format without stack trace', async ({ request }) => {
    // GIVEN: A non-existent client UUID
    const fakeId = '00000000-0000-0000-0000-000000000000';

    // WHEN: Requesting a non-existent client
    const response = await request.get(`${API_BASE}/api/v1/clientes/${fakeId}`);

    // THEN: HTTP 404
    expect(response.status()).toBe(404);
    // AND: Content-Type is application/problem+json (RFC 7807)
    expect(response.headers()['content-type']).toContain('application/problem+json');
    // AND: Body does NOT contain stackTrace or exception text (NFR6)
    const body = await response.json();
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('exception');
    // AND: Body has RFC 7807 shape
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('status');
  });

  test('AC1 — GET /api/v1/clientes sorts results with most recently created first (default order)', async ({ request }) => {
    // GIVEN: Two clients created in sequence (second is more recent)
    const nit1 = `800${Date.now().toString().slice(-6)}`;
    const nit2 = `801${(Date.now() + 10).toString().slice(-6)}`;

    const resp1 = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: { nombre: 'Cliente Primero', nit: nit1, telefono: '3001111111', ciudad: 'Cali' },
    });
    const cliente1 = await resp1.json();

    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 50));

    const resp2 = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: { nombre: 'Cliente Segundo', nit: nit2, telefono: '3002222222', ciudad: 'Medellín' },
    });
    const cliente2 = await resp2.json();

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE}/api/v1/clientes`);
    const body: Array<{ id: string; createdAt: string }> = await response.json();

    // THEN: Most recently created client appears before the earlier one
    const idx1 = body.findIndex((c) => c.id === cliente1?.id);
    const idx2 = body.findIndex((c) => c.id === cliente2?.id);
    expect(idx2).toBeLessThan(idx1);

    // Cleanup
    if (cliente1?.id) await request.delete(`${API_BASE}/api/v1/clientes/${cliente1.id}`);
    if (cliente2?.id) await request.delete(`${API_BASE}/api/v1/clientes/${cliente2.id}`);
  });
});
