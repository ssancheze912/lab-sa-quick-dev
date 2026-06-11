/**
 * Story 2.1: Client List & Search — API Integration Tests (RED Phase)
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until backend implementation is complete.
 *
 * Test Cases covered:
 *   TC-E2-P1-01 — GET /clientes returns 200 with array, all fields present, createdAt is ISO 8601 UTC
 *   TC-E2-P2-07 — GET /clientes?q=Alpha filters by name; ?q=111 filters by NIT
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-01: GET /api/v1/clientes Returns List with All Fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P1-01 — GET /api/v1/clientes returns list with all fields', () => {
  const seedIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // GIVEN: Three clients seeded in the database
    const clients = [
      { nombre: 'Alpha Corp', nit: 'TC-P1-01-111', telefono: '300-0001', ciudad: 'Bogotá' },
      { nombre: 'Beta Inc', nit: 'TC-P1-01-222', telefono: '300-0002', ciudad: 'Medellín' },
      { nombre: 'Gamma SA', nit: 'TC-P1-01-333', telefono: '300-0003', ciudad: 'Cali' },
    ];
    for (const c of clients) {
      const res = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: c });
      const body = await res.json();
      if (body.id) seedIds.push(body.id);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of seedIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
  });

  test('should return HTTP 200', async ({ request }) => {
    // GIVEN: Three clients exist in the database
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);
  });

  test('should return a JSON array', async ({ request }) => {
    // GIVEN: Three clients exist in the database
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response body is a JSON array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(3);
  });

  test('should include all required fields in each item', async ({ request }) => {
    // GIVEN: Three clients exist in the database
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Each item has id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    for (const item of body) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('nombre');
      expect(item).toHaveProperty('nit');
      expect(item).toHaveProperty('telefono');
      expect(item).toHaveProperty('ciudad');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    }
  });

  test('should return id as UUID format', async ({ request }) => {
    // GIVEN: Three clients exist in the database
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: id field matches UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const item of body) {
      expect(item.id).toMatch(uuidRegex);
    }
  });

  test('should return createdAt as ISO 8601 string with UTC offset (DateTimeOffset)', async ({ request }) => {
    // GIVEN: Three clients exist in the database
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: createdAt is ISO 8601 string with UTC offset (not plain DateTime)
    // ISO 8601 UTC offset: 2025-06-01T12:00:00+00:00 or 2025-06-01T12:00:00Z
    const iso8601WithOffsetRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
    for (const item of body) {
      expect(item.createdAt).toMatch(iso8601WithOffsetRegex);
      expect(item.updatedAt).toMatch(iso8601WithOffsetRegex);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-07: GET /api/v1/clientes?q= filters by name and NIT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P2-07 — GET /api/v1/clientes?q= filters results by name and NIT', () => {
  const seedIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // GIVEN: Database contains Alpha Corp (NIT 111) and Beta Inc (NIT 222)
    const clients = [
      { nombre: 'Alpha Corp Search Test', nit: 'TC-P2-07-111', telefono: '300-1111', ciudad: 'Bogotá' },
      { nombre: 'Beta Inc Search Test', nit: 'TC-P2-07-222', telefono: '300-2222', ciudad: 'Medellín' },
    ];
    for (const c of clients) {
      const res = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: c });
      const body = await res.json();
      if (body.id) seedIds.push(body.id);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of seedIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
  });

  test('should filter by nombre when ?q=Alpha is provided', async ({ request }) => {
    // GIVEN: Alpha Corp and Beta Inc exist
    // WHEN: GET /api/v1/clientes?q=Alpha
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes?q=Alpha`);

    // THEN: Only Alpha Corp is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    const alphaResults = body.filter((c: { nombre: string }) => c.nombre === 'Alpha Corp Search Test');
    expect(alphaResults.length).toBe(1);
    const betaResults = body.filter((c: { nombre: string }) => c.nombre === 'Beta Inc Search Test');
    expect(betaResults.length).toBe(0);
  });

  test('should filter by NIT when ?q=TC-P2-07-111 is provided', async ({ request }) => {
    // GIVEN: Alpha Corp (NIT TC-P2-07-111) and Beta Inc (NIT TC-P2-07-222) exist
    // WHEN: GET /api/v1/clientes?q=TC-P2-07-111
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes?q=TC-P2-07-111`);

    // THEN: Only the client with NIT TC-P2-07-111 is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    const matching = body.filter((c: { nit: string }) => c.nit === 'TC-P2-07-111');
    expect(matching.length).toBe(1);
  });

  test('should return empty array when ?q=xyz matches no record', async ({ request }) => {
    // GIVEN: No clients with "xyz" in nombre or NIT
    // WHEN: GET /api/v1/clientes?q=xyz
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes?q=xyzNoExiste999`);

    // THEN: Empty array is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });
});
