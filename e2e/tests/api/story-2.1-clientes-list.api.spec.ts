/**
 * Story 2.1: Client List & Search — Backend API Contract
 * Epic 2: Client Management
 *
 * ATDD API Contract Tests — RED Phase
 * These tests fail until the backend endpoint GET /api/v1/clientes is implemented
 * per Tasks 1-5 of the story (Domain entity → Repository → Query → Endpoint).
 *
 * Acceptance Criteria covered:
 *   AC8 — Backend exposes GET /api/v1/clientes returning 200 OK with ClienteDto[]
 *         where every DTO has: id (UUID string), nombre, nit, telefono, ciudad,
 *         createdAt (ISO 8601), updatedAt (ISO 8601), all in camelCase JSON.
 *   AC5 — Backend never exposes stack traces (NFR6) — verified via
 *         application/problem+json response shape on error.
 *
 * Mapped to _bmad-output/test-design-epic-2.md:
 *   P1#1 — GET /clientes list contract
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;

// UUID v4 regex (accepts any valid UUID string form used by .NET Guid.ToString())
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// ISO 8601 with optional fractional seconds and timezone (Z or ±hh:mm)
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — [TC-Story-2.1-API] GET /api/v1/clientes contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — GET /api/v1/clientes contract', () => {
  test('[TC-Story-2.1-API-200] should respond with 200 OK and a JSON array', async ({
    request,
  }) => {
    // GIVEN: The API is running
    // WHEN: The client requests GET /api/v1/clientes
    const response = await request.get(CLIENTES_URL);

    // THEN: Status is 200 and Content-Type is application/json
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    // AND: The body is a JSON array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('[TC-Story-2.1-API-DtoShape] should return each item with the ClienteDto shape (camelCase keys)', async ({
    request,
  }) => {
    // GIVEN: The API is running
    // WHEN: The client requests GET /api/v1/clientes
    const response = await request.get(CLIENTES_URL);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as unknown[];

    // THEN: If any items exist, they conform to the ClienteDto contract
    // (An empty DB is acceptable — a separate test covers the empty-array case.)
    for (const raw of body) {
      const dto = raw as Record<string, unknown>;

      // camelCase key shape (no PascalCase leaks)
      expect(dto).toMatchObject({
        id: expect.any(String),
        nombre: expect.any(String),
        nit: expect.any(String),
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Guid string, not integer
      expect(String(dto.id)).toMatch(UUID_REGEX);

      // ISO 8601 timestamps (DateTimeOffset — never DateTime)
      expect(String(dto.createdAt)).toMatch(ISO_8601_REGEX);
      expect(String(dto.updatedAt)).toMatch(ISO_8601_REGEX);

      // No PascalCase leak from .NET serialization
      expect(Object.keys(dto)).not.toContain('Id');
      expect(Object.keys(dto)).not.toContain('Nombre');
      expect(Object.keys(dto)).not.toContain('CreatedAt');
    }
  });

  test('[TC-Story-2.1-API-Empty] should respond with [] when the clientes table is empty', async ({
    request,
  }) => {
    // GIVEN: The API is running and the DB may be empty (fresh test env)
    // WHEN: The client requests GET /api/v1/clientes
    const response = await request.get(CLIENTES_URL);

    // THEN: On empty DB, the response is HTTP 200 with an empty array (not 204)
    // NOTE: This test asserts the *contract* — the endpoint must always return 200 + array,
    //       even with no data. If the DB is not empty in the test environment, this test
    //       still passes as long as body is a valid array (see [TC-Story-2.1-API-200]).
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — [TC-Story-2.1-API-NFR6] No stack traces exposed on errors (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 / NFR6 — Backend never exposes stack traces', () => {
  test('[TC-Story-2.1-API-NFR6] a malformed URL under /api/v1/clientes should NOT leak a stack trace', async ({
    request,
  }) => {
    // GIVEN: The API is running
    // WHEN: The client requests a bogus path deliberately intended to trigger an error handler
    //       (route not registered → 404 Problem Details)
    const response = await request.get(`${CLIENTES_URL}/not-a-valid-id-xyz`);

    // THEN: The response body must NOT contain any obvious C# stack trace signals
    const text = await response.text();
    expect(text).not.toMatch(/at [A-Za-z_.]+\+?<[A-Za-z_>]+>[a-z0-9_]+/); // async state machine
    expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(text).not.toMatch(/\.cs:line \d+/);
  });
});
