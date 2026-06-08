/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — GET /api/v1/clientes returns 200 with a JSON array of clients (Nombre, NIT/RUC)
 *   AC2 — API returns all clients (up to 500) — frontend filtering is client-side
 *   AC5 — Backend returns 503/500 when unavailable (tested via contract verification)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — GET /api/v1/clientes returns 200 with ClienteDto array
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — GET /api/v1/clientes contract', () => {
  test('should return HTTP 200 from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The backend is running and the clientes endpoint is registered
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response is 200 OK
    expect(response.status()).toBe(200);
  });

  test('should return a JSON array (not an object wrapper) from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The clientes endpoint follows the direct array response contract
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response body is a JSON array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return Content-Type application/json from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The clientes endpoint returns JSON
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response Content-Type contains application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return client items with "id" as a UUID string', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // WHEN: A GET request is made to /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<{ id: unknown }>;

      // THEN: Each item has an "id" that is a non-empty string (UUID format)
      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();
      expect(typeof item!.id).toBe('string');
      expect((item!.id as string).length).toBeGreaterThan(0);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should return client items with "nombre" field', async ({ request }) => {
    // GIVEN: At least one client with a known Nombre exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // WHEN: A GET request is made to /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<{ id: string; nombre: string }>;

      // THEN: The created client item has a "nombre" field matching the input
      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();
      expect(item!.nombre).toBe(data.nombre);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should return client items with "nit" field', async ({ request }) => {
    // GIVEN: At least one client with a known NIT exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // WHEN: A GET request is made to /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<{ id: string; nit: string }>;

      // THEN: The created client item has a "nit" field matching the input
      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();
      expect(item!.nit).toBe(data.nit);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should return client items with "telefono" and "ciudad" fields', async ({ request }) => {
    // GIVEN: At least one client exists with telefono and ciudad
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ telefono: '3001234567', ciudad: 'Bogotá' });
    const created = await apiHelper.createCliente(data);

    try {
      // WHEN: A GET request is made to /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<{ id: string; telefono: string; ciudad: string }>;

      // THEN: The created client item has "telefono" and "ciudad"
      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();
      expect(item!.telefono).toBe(data.telefono);
      expect(item!.ciudad).toBe(data.ciudad);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should return client items with "createdAt" and "updatedAt" ISO datetime fields', async ({ request }) => {
    // GIVEN: A client was created and the entity tracks timestamps
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // WHEN: A GET request is made to /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<{ id: string; createdAt: string; updatedAt: string }>;

      // THEN: The client item has ISO 8601 datetime strings for createdAt and updatedAt
      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();
      expect(typeof item!.createdAt).toBe('string');
      expect(new Date(item!.createdAt).toISOString()).toBe(item!.createdAt);
      expect(typeof item!.updatedAt).toBe('string');
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — GET /api/v1/clientes returns all clients (no search param needed)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — GET /api/v1/clientes returns complete dataset', () => {
  test('should return all clients without requiring a search query parameter', async ({ request }) => {
    // GIVEN: The endpoint has no mandatory query parameters (filtering is client-side)
    // WHEN: A GET request is made WITHOUT any query parameters
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response is successful — no 400 or 422 for missing parameters
    expect(response.status()).toBe(200);
  });

  test('should include a newly created client in the response', async ({ request }) => {
    // GIVEN: A new client is created via POST
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // WHEN: A GET request is made to /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<{ id: string }>;

      // THEN: The newly created client is present in the response array
      const found = body.some((c) => c.id === created.id);
      expect(found).toBe(true);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should return an empty array when no clients exist in the system', async ({ request }) => {
    // GIVEN: The system has no clients
    // Note: This test assumes a clean state (integration test environment responsibility)
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The response is 200 with a (possibly empty) JSON array — never null
    expect(response.status()).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NIT uniqueness constraint (uk_clientes_nit)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — NIT uniqueness constraint on clientes', () => {
  test('should reject creation of a second client with a duplicate NIT with 409 Conflict', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // WHEN: A second client with the same NIT is submitted
      const duplicateData = buildCliente({ nit: data.nit });
      const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
        data: duplicateData,
      });

      // THEN: The backend rejects the request with 409 Conflict
      expect(response.status()).toBe(409);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });
});
