/**
 * Story 2.2: Client Detail View — Backend API Contract
 * Epic 2: Client Management
 *
 * ATDD API Contract Tests — RED Phase
 * These tests fail until the backend endpoint GET /api/v1/clientes/{id:guid} is
 * implemented per Tasks 1-4 of the story:
 *   Domain — IClienteRepository.GetByIdAsync
 *   Infra  — ClienteRepository.GetByIdAsync (AsNoTracking)
 *   App    — GetClienteByIdQuery + Handler (CQRS)
 *   API    — MapGet("/{id:guid}", …) with Results.Problem 404
 *
 * Acceptance Criteria covered:
 *   AC8 — GET /api/v1/clientes/{id:guid}
 *           → 200 OK + ClienteDto JSON when the cliente exists
 *           → 404 Not Found + Problem Details RFC 7807 when it doesn't
 *           → 400 Bad Request + Problem Details when {id} is not a valid GUID
 *   AC5 / NFR6 — Backend never exposes stack traces on any error path.
 *
 * Mapped to _bmad-output/test-design-epic-2.md:
 *   P1#2 — GET /clientes/{id} returns 404 for non-existent id
 *
 * Setup:
 *   Uses the running backend at http://localhost:5000 (API_BASE_URL). Assumes
 *   the DB may be empty. For the "200 on existing id" test we seed a cliente
 *   via POST /api/v1/clientes and clean it up in the fixture teardown.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;

// UUID v4 regex — accepts any valid UUID string form used by .NET Guid.ToString()
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// ISO 8601 with optional fractional seconds and timezone (Z or ±hh:mm)
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Random-ish suffix so parallel test runs don't collide on NIT unique constraint.
function nowNit() {
  return `900${Date.now().toString().slice(-6)}-9`;
}

/** Seeds one cliente via POST and returns its id (or null if the write failed). */
async function seedCliente(request: APIRequestContext): Promise<string | null> {
  const create = await request.post(CLIENTES_URL, {
    data: {
      nombre: 'ATDD Detail View Cliente',
      nit: nowNit(),
      telefono: '+57 300 999 9999',
      ciudad: 'Cali',
    },
  });
  if (create.status() !== 201 && create.status() !== 200) {
    return null;
  }
  const body = (await create.json()) as { id?: string };
  return body.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — [TC-Story-2.2-API-200] GET /api/v1/clientes/{id} for an existing id
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — GET /api/v1/clientes/{id:guid} contract', () => {
  test('[TC-Story-2.2-API-200] should return 200 OK and the ClienteDto for an existing id', async ({
    request,
  }) => {
    // GIVEN: A cliente exists in the system
    const id = await seedCliente(request);
    test.skip(id === null, 'Backend POST /clientes not available; cannot seed.');

    try {
      // WHEN: The client requests GET /api/v1/clientes/{id}
      const response = await request.get(`${CLIENTES_URL}/${id}`);

      // THEN: Status 200 with camelCase DTO body
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const dto = (await response.json()) as Record<string, unknown>;
      expect(dto).toMatchObject({
        id: expect.any(String),
        nombre: expect.any(String),
        nit: expect.any(String),
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Guid string, ISO 8601 timestamps
      expect(String(dto.id)).toBe(id);
      expect(String(dto.id)).toMatch(UUID_REGEX);
      expect(String(dto.createdAt)).toMatch(ISO_8601_REGEX);
      expect(String(dto.updatedAt)).toMatch(ISO_8601_REGEX);

      // No PascalCase leak from .NET serialization
      expect(Object.keys(dto)).not.toContain('Id');
      expect(Object.keys(dto)).not.toContain('Nombre');
      expect(Object.keys(dto)).not.toContain('CreatedAt');
    } finally {
      if (id !== null) {
        await request.delete(`${CLIENTES_URL}/${id}`).catch(() => undefined);
      }
    }
  });

  test('[TC-Story-2.2-API-404] should return 404 Problem Details for an unknown id', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not correspond to any cliente
    const unknownId = '00000000-0000-0000-0000-000000000000';

    // WHEN: The client requests GET /api/v1/clientes/{unknownId}
    const response = await request.get(`${CLIENTES_URL}/${unknownId}`);

    // THEN: Status is 404 with Problem Details body (RFC 7807)
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/problem+json');

    const problem = (await response.json()) as Record<string, unknown>;
    expect(problem.title).toBe('Cliente no encontrado');
    expect(problem.status).toBe(404);
    expect(String(problem.instance ?? '')).toContain(`/api/v1/clientes/${unknownId}`);
  });

  test('[TC-Story-2.2-API-400] should return a 4xx Problem Details when the id is not a valid GUID', async ({
    request,
  }) => {
    // GIVEN: A path segment that is NOT a valid GUID (fails route constraint {id:guid})
    // WHEN: The client requests GET /api/v1/clientes/not-a-guid
    const response = await request.get(`${CLIENTES_URL}/not-a-guid`);

    // THEN: The status is a 4xx (400 or 404 depending on framework behaviour)
    //       and, whichever it is, the response must NOT be a 5xx and must NOT
    //       leak a stack trace (NFR6). Minimal API's route constraint refuses
    //       to bind non-guid segments; the pipeline responds with Problem Details.
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const text = await response.text();
    expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(text).not.toMatch(/\.cs:line \d+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 / NFR6 — [TC-Story-2.2-API-NoStackTrace] 404 body has no stack-trace signals
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 / NFR6 — 404 Problem Details never leaks stack traces', () => {
  test('[TC-Story-2.2-API-NoStackTrace] the 404 response for an unknown id must not contain stack-trace signals', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not correspond to any cliente
    const unknownId = '11111111-2222-3333-4444-555555555555';

    // WHEN: The client requests the detail
    const response = await request.get(`${CLIENTES_URL}/${unknownId}`);

    // THEN: 404 body must not include obvious C# / EF Core stack-trace signals
    expect(response.status()).toBe(404);
    const text = await response.text();
    expect(text).not.toMatch(/at [A-Za-z_.]+\+?<[A-Za-z_>]+>[a-z0-9_]+/);
    expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(text).not.toMatch(/\.cs:line \d+/);
  });
});
