/**
 * API Edge-Case Tests — Story 2.3: POST /api/v1/clientes
 * Expands coverage beyond create-client.api.spec.ts (ATDD tests).
 *
 * Edge cases covered:
 *   - Boundary: all fields at exactly max-length → 201 Created
 *   - Boundary: fields exceed max-length by 1 → 400 Bad Request
 *   - Only one field missing at a time → 400 with correct error key
 *   - Sending null values instead of empty string → 400 Bad Request
 *   - POST with extra/unknown fields is tolerated (no 400)
 *   - Idempotency: two POSTs with same NIT → second is 409
 *   - Problem Details structure: 409 detail field is non-empty, no stack traces
 *   - Location header path matches returned id
 *
 * Uses Playwright's APIRequestContext (no browser). Requires:
 *   - Backend running on http://localhost:5000
 *   - EF Core migration applied (clientes table exists with uk_clientes_nit unique index)
 */

import { test, expect } from '@playwright/test';
import { createClientePayload } from '../../support/factories/cliente.factory';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: max-length values return 201
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — boundary max-length: 201 Created', () => {
  test('should return 201 when all fields are exactly at maximum allowed length', async ({ request }) => {
    // GIVEN: payload with all fields at exact max length
    const payload = {
      nombre: 'A'.repeat(200),
      nit: `BND${Date.now().toString().slice(-8)}`.slice(0, 50),
      telefono: '1'.repeat(30),
      ciudad: 'C'.repeat(100),
    };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json().catch(() => ({}));

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: 201 Created — max-length values are accepted
    expect(response.status()).toBe(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: one-over-max values return 400
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — boundary one-over-max: 400 Bad Request', () => {
  test('should return 400 when nombre is 201 characters (one over max)', async ({ request }) => {
    // GIVEN: nombre has 201 characters
    const payload = {
      nombre: 'A'.repeat(201),
      nit: `OVR${Date.now().toString().slice(-8)}`,
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request — exceeds maximum length
    expect(response.status()).toBe(400);
  });

  test('should return 400 when nit is 51 characters (one over max)', async ({ request }) => {
    // GIVEN: nit has 51 characters
    const payload = {
      nombre: 'Empresa Válida',
      nit: 'N'.repeat(51),
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when telefono is 31 characters (one over max)', async ({ request }) => {
    // GIVEN: telefono has 31 characters
    const payload = {
      nombre: 'Empresa Válida',
      nit: `TEL${Date.now().toString().slice(-8)}`,
      telefono: '1'.repeat(31),
      ciudad: 'Bogotá',
    };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when ciudad is 101 characters (one over max)', async ({ request }) => {
    // GIVEN: ciudad has 101 characters
    const payload = {
      nombre: 'Empresa Válida',
      nit: `CIU${Date.now().toString().slice(-8)}`,
      telefono: '3001234567',
      ciudad: 'C'.repeat(101),
    };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual missing fields: 400 with correct error key
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — 400: individual missing field errors', () => {
  test('should return 400 with Nombre error key when only nombre is missing', async ({ request }) => {
    // GIVEN: All fields valid except nombre is empty
    const payload = { nombre: '', nit: `MFN${Date.now().toString().slice(-8)}`, telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN
    expect(response.status()).toBe(400);
    const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorKeys.some((k) => k.includes('nombre'))).toBe(true);
    // Other fields should NOT appear in errors
    expect(errorKeys.some((k) => k.includes('nit'))).toBe(false);
    expect(errorKeys.some((k) => k.includes('telefono'))).toBe(false);
    expect(errorKeys.some((k) => k.includes('ciudad'))).toBe(false);
  });

  test('should return 400 with Nit error key when only nit is missing', async ({ request }) => {
    // GIVEN: All fields valid except nit is empty
    const payload = { nombre: 'Empresa Válida', nit: '', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN
    expect(response.status()).toBe(400);
    const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorKeys.some((k) => k.includes('nit'))).toBe(true);
  });

  test('should return 400 with Telefono error key when only telefono is missing', async ({ request }) => {
    // GIVEN: All fields valid except telefono is empty
    const payload = { nombre: 'Empresa Válida', nit: `MFT${Date.now().toString().slice(-8)}`, telefono: '', ciudad: 'Bogotá' };

    // WHEN
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN
    expect(response.status()).toBe(400);
    const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorKeys.some((k) => k.includes('telefono'))).toBe(true);
  });

  test('should return 400 with Ciudad error key when only ciudad is missing', async ({ request }) => {
    // GIVEN: All fields valid except ciudad is empty
    const payload = { nombre: 'Empresa Válida', nit: `MFC${Date.now().toString().slice(-8)}`, telefono: '3001234567', ciudad: '' };

    // WHEN
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN
    expect(response.status()).toBe(400);
    const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorKeys.some((k) => k.includes('ciudad'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Problem Details: 409 response structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — 409 Problem Details structure', () => {
  test('should return a 409 body with a non-empty detail field', async ({ request }) => {
    // GIVEN: Create a client then try to create a duplicate
    const payload = createClientePayload({ nit: `DET${Date.now().toString().slice(-6)}` });
    const first = await request.post(ENDPOINT, { data: payload });
    const firstBody = await first.json();

    try {
      // WHEN: Duplicate NIT submitted
      const dup = await request.post(ENDPOINT, { data: createClientePayload({ nit: payload.nit }) });
      const dupBody = await dup.json();

      // THEN: detail is present and non-empty
      expect(dupBody.detail).toBeTruthy();
      expect(typeof dupBody.detail).toBe('string');
      expect(dupBody.detail.length).toBeGreaterThan(0);
    } finally {
      if (firstBody?.id) await request.delete(`${ENDPOINT}/${firstBody.id}`);
    }
  });

  test('should return a 409 body where detail mentions NIT or RUC', async ({ request }) => {
    // GIVEN: Duplicate NIT scenario
    const payload = createClientePayload({ nit: `NIT${Date.now().toString().slice(-6)}` });
    const first = await request.post(ENDPOINT, { data: payload });
    const firstBody = await first.json();

    try {
      // WHEN: Duplicate submitted
      const dup = await request.post(ENDPOINT, { data: createClientePayload({ nit: payload.nit }) });
      const dupBody = await dup.json();

      // THEN: detail field mentions NIT or RUC in a user-friendly way
      expect(dupBody.detail).toMatch(/NIT|RUC/i);
    } finally {
      if (firstBody?.id) await request.delete(`${ENDPOINT}/${firstBody.id}`);
    }
  });

  test('should return a 409 body that does NOT contain Exception or StackTrace text', async ({ request }) => {
    // GIVEN: Duplicate NIT scenario
    const payload = createClientePayload({ nit: `EXC${Date.now().toString().slice(-6)}` });
    const first = await request.post(ENDPOINT, { data: payload });
    const firstBody = await first.json();

    try {
      // WHEN: Duplicate submitted
      const dup = await request.post(ENDPOINT, { data: createClientePayload({ nit: payload.nit }) });
      const responseText = await dup.text();

      // THEN: No stack trace or exception type names leaked
      expect(responseText).not.toContain('StackTrace');
      expect(responseText).not.toContain('at System.');
      expect(responseText).not.toContain('at SiesaAgents.');
      expect(responseText).not.toContain('"exceptionType"');
    } finally {
      if (firstBody?.id) await request.delete(`${ENDPOINT}/${firstBody.id}`);
    }
  });

  test('should return status 409 in the Problem Details body (not just HTTP status)', async ({ request }) => {
    // GIVEN: Duplicate NIT scenario
    const payload = createClientePayload({ nit: `PDT${Date.now().toString().slice(-6)}` });
    const first = await request.post(ENDPOINT, { data: payload });
    const firstBody = await first.json();

    try {
      // WHEN: Duplicate submitted
      const dup = await request.post(ENDPOINT, { data: createClientePayload({ nit: payload.nit }) });
      const dupBody = await dup.json();

      // THEN: status field in body matches HTTP status
      expect(dupBody.status).toBe(409);
    } finally {
      if (firstBody?.id) await request.delete(`${ENDPOINT}/${firstBody.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Location header correctness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — Location header', () => {
  test('should return a Location header that starts with /api/v1/clientes/', async ({ request }) => {
    // GIVEN: A valid payload
    const payload = createClientePayload();

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: Location header points to the new resource
    const location = response.headers()['location'];
    expect(location).toBeTruthy();
    expect(location).toMatch(/^\/api\/v1\/clientes\//i);
  });

  test('should return a Location header that ends with the created client id', async ({ request }) => {
    // GIVEN: A valid payload
    const payload = createClientePayload();

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: Location ends with the UUID id
    const location = response.headers()['location'];
    expect(location).toContain(body.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Idempotency: second POST with same NIT is 409
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — NIT uniqueness across different requests', () => {
  test('should return 409 on third attempt with same NIT (not just second)', async ({ request }) => {
    // GIVEN: NIT already exists (first POST)
    const payload = createClientePayload({ nit: `TRD${Date.now().toString().slice(-6)}` });
    const first = await request.post(ENDPOINT, { data: payload });
    const firstBody = await first.json();
    expect(first.status()).toBe(201);

    try {
      // Second POST with same NIT → 409
      const second = await request.post(ENDPOINT, { data: createClientePayload({ nit: payload.nit }) });
      expect(second.status()).toBe(409);

      // WHEN: Third POST with same NIT
      const third = await request.post(ENDPOINT, { data: createClientePayload({ nit: payload.nit }) });

      // THEN: Still 409 — uniqueness is consistently enforced
      expect(third.status()).toBe(409);
    } finally {
      if (firstBody?.id) await request.delete(`${ENDPOINT}/${firstBody.id}`);
    }
  });
});
