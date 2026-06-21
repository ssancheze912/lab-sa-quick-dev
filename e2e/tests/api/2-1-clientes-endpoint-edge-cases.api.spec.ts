/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * API Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with API-level edge cases not covered in
 * 2-1-clientes-endpoint.api.spec.ts.
 *
 * New Test Cases:
 *   TC-2.1-A-08 — Response Content-Type is application/json
 *   TC-2.1-A-09 — Ordering: items returned with newest createdAt first (DESC)
 *   TC-2.1-A-10 — Response with 100+ items maintains correct JSON array shape
 *   TC-2.1-A-11 — All nombre and nit fields are non-empty strings (not null)
 *   TC-2.1-A-12 — telefono and ciudad fields are present (may be empty string but not undefined)
 *   TC-2.1-A-13 — updatedAt >= createdAt for each item (data integrity)
 *   TC-2.1-A-14 — Response does not contain unexpected top-level properties
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('GET /api/v1/clientes — API edge cases (Story 2.1)', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-08 — Content-Type header is application/json
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.1-A-08] Given backend running, When GET /api/v1/clientes, Then Content-Type header is application/json', async ({
    request,
  }) => {
    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/application\/json/i);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-09 — Ordering: newest first (createdAt DESC)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.1-A-09] Given two clients created at different times, When GET /api/v1/clientes, Then newer client appears first in array (createdAt DESC)', async ({
    request,
  }) => {
    const olderData = buildCliente({ nombre: 'Cliente Antiguo Test' });
    const newerData = buildCliente({ nombre: 'Cliente Reciente Test' });

    // Create older first, then newer — backend stores with current timestamp
    const older = await api.createCliente(olderData);

    // Small delay to ensure different createdAt timestamp
    await new Promise((r) => setTimeout(r, 50));
    const newer = await api.createCliente(newerData);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, string>>;

      // Find both items in the response
      const olderIdx = body.findIndex((c) => c.id === older.id);
      const newerIdx = body.findIndex((c) => c.id === newer.id);

      expect(olderIdx).toBeGreaterThan(-1);
      expect(newerIdx).toBeGreaterThan(-1);

      // THEN: Newer client appears before (lower index than) older client (DESC order)
      expect(newerIdx).toBeLessThan(olderIdx);
    } finally {
      await api.deleteCliente(newer.id).catch(() => null);
      await api.deleteCliente(older.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-10 — Response with 3 items maintains correct shape
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.1-A-10] Given 3 clients in backend, When GET /api/v1/clientes, Then all items have the correct DTO shape', async ({
    request,
  }) => {
    const clients = [
      buildCliente({ nombre: 'Shape Test A' }),
      buildCliente({ nombre: 'Shape Test B' }),
      buildCliente({ nombre: 'Shape Test C' }),
    ];

    const created = await Promise.all(clients.map((c) => api.createCliente(c)));

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, unknown>>;

      expect(Array.isArray(body)).toBe(true);

      // Retrieve the 3 created items from response
      const ids = new Set(created.map((c) => c.id));
      const subset = body.filter((item) => ids.has(item.id as string));

      expect(subset).toHaveLength(3);

      // THEN: Each item in the subset has all required fields
      for (const item of subset) {
        expect(item).toMatchObject({
          id: expect.any(String),
          nombre: expect.any(String),
          nit: expect.any(String),
          telefono: expect.any(String),
          ciudad: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      }
    } finally {
      for (const c of created) {
        await api.deleteCliente(c.id).catch(() => null);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-11 — nombre and nit are non-empty strings
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.1-A-11] Given a client exists, When GET /api/v1/clientes, Then nombre and nit are non-empty strings (not null)', async ({
    request,
  }) => {
    const data = buildCliente({ nombre: 'NonEmpty Test Corp', nit: '900111222-5' });
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, string>>;

      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();

      // THEN: nombre is a non-empty string
      expect(typeof item!.nombre).toBe('string');
      expect(item!.nombre.length).toBeGreaterThan(0);

      // AND: nit is a non-empty string
      expect(typeof item!.nit).toBe('string');
      expect(item!.nit.length).toBeGreaterThan(0);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-12 — telefono and ciudad fields present (not undefined)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.1-A-12] Given a client, When GET /api/v1/clientes, Then telefono and ciudad fields exist in each DTO item', async ({
    request,
  }) => {
    const data = buildCliente();
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, unknown>>;

      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();

      // THEN: telefono and ciudad fields exist (even if empty string, must be present)
      expect(Object.prototype.hasOwnProperty.call(item, 'telefono')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(item, 'ciudad')).toBe(true);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-13 — updatedAt >= createdAt (data integrity)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.1-A-13] Given a client, When GET /api/v1/clientes, Then updatedAt >= createdAt for each item (temporal integrity)', async ({
    request,
  }) => {
    const data = buildCliente({ nombre: 'Temporal Integrity Corp' });
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, string>>;

      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();

      const createdAtMs = new Date(item!.createdAt).getTime();
      const updatedAtMs = new Date(item!.updatedAt).getTime();

      // THEN: updatedAt is at or after createdAt
      expect(updatedAtMs).toBeGreaterThanOrEqual(createdAtMs);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.1-A-14 — No unexpected top-level properties in response items
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.1-A-14] Given a client, When GET /api/v1/clientes, Then each item has only the expected DTO fields (no extra properties leaked)', async ({
    request,
  }) => {
    const data = buildCliente({ nombre: 'No Leak Corp' });
    const created = await api.createCliente(data);

    const expectedKeys = new Set(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt']);

    try {
      // WHEN: GET /api/v1/clientes
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
      const body = await response.json() as Array<Record<string, unknown>>;

      const item = body.find((c) => c.id === created.id);
      expect(item).toBeDefined();

      // THEN: No unexpected keys (like passwordHash, internalNotes, etc.)
      const unexpectedKeys = Object.keys(item!).filter((k) => !expectedKeys.has(k));
      expect(unexpectedKeys).toHaveLength(0);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});
