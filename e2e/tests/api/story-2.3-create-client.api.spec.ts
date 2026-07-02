/**
 * Story 2.3: Create Client — Backend API Contract
 * Epic 2: Client Management
 *
 * ATDD API Contract Tests — RED Phase
 * These tests fail until the backend endpoint POST /api/v1/clientes is
 * implemented per Tasks 1-7 of the story:
 *   Domain — DuplicateNitException + IClienteRepository.AddAsync
 *   Infra  — ClienteRepository.AddAsync (delegates to EF Core, lets 23505 bubble)
 *   App    — CreateClienteCommand + CreateClienteCommandHandler (maps 23505 → DuplicateNitException)
 *   App    — CreateClienteRequest + CreateClienteRequestValidator (FluentValidation)
 *   API    — MapPost("/", …) with ValidationProblem (400) + Problem (409) + Created (201)
 *
 * Acceptance Criteria covered:
 *   AC7 — POST /api/v1/clientes:
 *           → 201 Created + Location header + ClienteDto (camelCase) when payload is valid
 *           → 400 Bad Request + Problem Details (errors dictionary) when required fields
 *             are empty, whitespace-only, or exceed MaxLength
 *           → 409 Conflict + Problem Details when NIT violates uk_clientes_nit
 *   AC5 / NFR6 — 409 body never leaks stack traces or EF Core internals.
 *
 * Mapped to _bmad-output/test-design-epic-2.md:
 *   P0#3 — POST /clientes with duplicate NIT returns 409
 *   P0#9 — Required fields validation returns 400
 *   R-002 — Duplicate NIT mitigation at API level
 *
 * Setup:
 *   Uses the running backend at http://localhost:5000 (API_BASE_URL). Each
 *   test that needs a seed creates one via POST and cleans it up in a finally
 *   block. NITs are randomised per test to avoid parallel-run collisions on
 *   the unique index uk_clientes_nit.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;

// UUID v4-ish regex accepted by .NET Guid.ToString()
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Random-ish NIT so parallel test runs don't collide.
function uniqueNit(seed = '') {
  return `900${Date.now().toString().slice(-6)}${seed}-9`.slice(0, 20);
}

function buildValidPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nombre: 'ATDD Story 2.3 Cliente',
    nit: uniqueNit('a'),
    telefono: '+57 300 555 0000',
    ciudad: 'Medellín',
    ...overrides,
  };
}

async function tryDelete(request: APIRequestContext, id: string | null | undefined) {
  if (!id) return;
  await request.delete(`${CLIENTES_URL}/${id}`).catch(() => undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — [TC-Story-2.3-API-201] POST /api/v1/clientes → 201 Created with Location
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — POST /api/v1/clientes contract (happy path)', () => {
  test('[TC-Story-2.3-API-201] valid payload returns 201 + Location + camelCase ClienteDto', async ({
    request,
  }) => {
    // GIVEN: A valid create-cliente payload
    const payload = buildValidPayload({ nit: uniqueNit('h') });
    let createdId: string | null = null;
    try {
      // WHEN: The client posts to /api/v1/clientes
      const response = await request.post(CLIENTES_URL, { data: payload });

      // THEN: The server returns 201 with the freshly persisted DTO
      expect(response.status()).toBe(201);
      expect(response.headers()['content-type']).toContain('application/json');

      const dto = (await response.json()) as Record<string, unknown>;
      createdId = typeof dto.id === 'string' ? dto.id : null;

      expect(dto).toMatchObject({
        id: expect.any(String),
        nombre: payload.nombre,
        nit: payload.nit,
        telefono: payload.telefono,
        ciudad: payload.ciudad,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // AND: The id is a valid Guid; timestamps are ISO 8601
      expect(String(dto.id)).toMatch(UUID_REGEX);
      expect(String(dto.createdAt)).toMatch(ISO_8601_REGEX);
      expect(String(dto.updatedAt)).toMatch(ISO_8601_REGEX);

      // AND: No PascalCase leak from .NET default serialization
      expect(Object.keys(dto)).not.toContain('Id');
      expect(Object.keys(dto)).not.toContain('Nombre');
      expect(Object.keys(dto)).not.toContain('CreatedAt');

      // AND: The Location header points to the new resource
      const location = response.headers()['location'];
      expect(location).toBeDefined();
      expect(location).toContain(`/api/v1/clientes/${dto.id}`);
    } finally {
      await tryDelete(request, createdId);
    }
  });

  test('[TC-Story-2.3-API-201-RoundTrip] GET Location returns the same DTO (round-trip)', async ({
    request,
  }) => {
    // GIVEN: A valid create-cliente payload
    const payload = buildValidPayload({ nit: uniqueNit('r') });
    let createdId: string | null = null;
    try {
      const create = await request.post(CLIENTES_URL, { data: payload });
      expect(create.status()).toBe(201);
      const dto = (await create.json()) as { id?: string };
      createdId = dto.id ?? null;
      expect(createdId).toBeTruthy();

      // WHEN: The client fetches the Location URL
      const fetched = await request.get(`${CLIENTES_URL}/${createdId}`);

      // THEN: 200 with the same body shape as the create response
      expect(fetched.status()).toBe(200);
      const body = (await fetched.json()) as Record<string, unknown>;
      expect(body).toMatchObject({
        id: createdId,
        nombre: payload.nombre,
        nit: payload.nit,
        telefono: payload.telefono,
        ciudad: payload.ciudad,
      });
    } finally {
      await tryDelete(request, createdId);
    }
  });

  test('[TC-Story-2.3-API-201-Trim] server trims the four string fields before persisting', async ({
    request,
  }) => {
    // GIVEN: A payload with leading/trailing whitespace in every field
    const payload = {
      nombre: '  Trimmed Cliente  ',
      nit: `  ${uniqueNit('t')}  `,
      telefono: '  +57 300 000 0000  ',
      ciudad: '  Cali  ',
    };
    let createdId: string | null = null;
    try {
      // WHEN: The client posts the payload
      const response = await request.post(CLIENTES_URL, { data: payload });
      expect(response.status()).toBe(201);
      const dto = (await response.json()) as Record<string, unknown>;
      createdId = typeof dto.id === 'string' ? dto.id : null;

      // THEN: The persisted values are trimmed
      expect(dto.nombre).toBe('Trimmed Cliente');
      expect(dto.nit).toBe(payload.nit.trim());
      expect(dto.telefono).toBe('+57 300 000 0000');
      expect(dto.ciudad).toBe('Cali');
    } finally {
      await tryDelete(request, createdId);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — [TC-Story-2.3-API-400] Empty / whitespace fields → 400 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — POST /api/v1/clientes rejects invalid payloads with 400 Problem Details', () => {
  test('[TC-Story-2.3-API-400-EmptyNombre] empty Nombre returns 400 with errors.nombre', async ({
    request,
  }) => {
    // GIVEN: A payload with an empty Nombre
    const payload = buildValidPayload({ nombre: '', nit: uniqueNit('e1') });

    // WHEN: The client posts the invalid payload
    const response = await request.post(CLIENTES_URL, { data: payload });

    // THEN: Status is 400 with application/problem+json content type
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/problem+json');

    const problem = (await response.json()) as {
      errors?: Record<string, string[]>;
      status?: number;
    };
    expect(problem.status).toBe(400);
    expect(problem.errors).toBeDefined();
    // The camelCase field name key is present with a message
    const errorsKeys = Object.keys(problem.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorsKeys).toContain('nombre');
  });

  test('[TC-Story-2.3-API-400-WhitespaceAll] whitespace-only fields → 400 with 4 error keys', async ({
    request,
  }) => {
    // GIVEN: A payload with all fields set to whitespace
    const payload = {
      nombre: '   ',
      nit: '\t  ',
      telefono: '  ',
      ciudad: ' \n ',
    };

    // WHEN: The client posts the invalid payload
    const response = await request.post(CLIENTES_URL, { data: payload });

    // THEN: Status is 400 and errors contains all four field keys
    expect(response.status()).toBe(400);
    const problem = (await response.json()) as {
      errors?: Record<string, string[]>;
    };
    const errorsKeys = Object.keys(problem.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorsKeys).toEqual(
      expect.arrayContaining(['nombre', 'nit', 'telefono', 'ciudad']),
    );
  });

  test('[TC-Story-2.3-API-400-NitMaxLength] NIT longer than 50 chars → 400 with MaxLength error', async ({
    request,
  }) => {
    // GIVEN: A NIT of 51 characters (exceeds Cliente.Nit MaxLength = 50)
    const payload = buildValidPayload({ nit: 'A'.repeat(51) });

    // WHEN: The client posts the payload
    const response = await request.post(CLIENTES_URL, { data: payload });

    // THEN: 400 with a nit error key
    expect(response.status()).toBe(400);
    const problem = (await response.json()) as { errors?: Record<string, string[]> };
    const errorsKeys = Object.keys(problem.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorsKeys).toContain('nit');
  });

  test('[TC-Story-2.3-API-400-NoStackTrace] 400 body must not contain stack-trace signals (NFR6)', async ({
    request,
  }) => {
    // GIVEN: A payload with empty Nombre triggers validation failure
    const payload = buildValidPayload({ nombre: '', nit: uniqueNit('n') });

    // WHEN: The client posts the invalid payload
    const response = await request.post(CLIENTES_URL, { data: payload });

    // THEN: The 400 response body does not contain any stack-trace signals
    expect(response.status()).toBe(400);
    const text = await response.text();
    expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(text).not.toMatch(/\.cs:line \d+/);
    expect(text).not.toMatch(/Npgsql\./);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 / AC5 — [TC-Story-2.3-API-409] Duplicate NIT → 409 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 / AC5 — POST /api/v1/clientes returns 409 when NIT already exists', () => {
  test('[TC-Story-2.3-API-409-Duplicate] second POST with same NIT returns 409 with expected copy', async ({
    request,
  }) => {
    // GIVEN: A cliente already exists with a specific NIT
    const nit = uniqueNit('d');
    const firstPayload = buildValidPayload({ nit });
    let firstId: string | null = null;
    try {
      const first = await request.post(CLIENTES_URL, { data: firstPayload });
      expect(first.status()).toBe(201);
      const firstDto = (await first.json()) as { id?: string };
      firstId = firstDto.id ?? null;
      expect(firstId).toBeTruthy();

      // WHEN: A second client posts a different cliente with the same NIT
      const duplicatePayload = buildValidPayload({
        nit,
        nombre: 'Duplicate Attempt',
      });
      const response = await request.post(CLIENTES_URL, { data: duplicatePayload });

      // THEN: Status is 409 Conflict with Problem Details body
      expect(response.status()).toBe(409);
      expect(response.headers()['content-type']).toContain(
        'application/problem+json',
      );

      const problem = (await response.json()) as Record<string, unknown>;
      expect(problem.status).toBe(409);
      expect(problem.title).toBe('NIT/RUC duplicado');
      expect(String(problem.detail ?? '')).toContain(
        'Ya existe un cliente con el NIT/RUC indicado.',
      );

      // AND: The extensions bag (or root) signals the offending field is "nit"
      const rootField = problem.field;
      const extensions = problem.extensions as
        | { field?: string; [k: string]: unknown }
        | undefined;
      const flaggedField =
        (typeof rootField === 'string' ? rootField : undefined) ??
        (extensions && typeof extensions.field === 'string' ? extensions.field : undefined);
      expect(flaggedField).toBe('nit');
    } finally {
      await tryDelete(request, firstId);
    }
  });

  test('[TC-Story-2.3-API-409-NoLeak] 409 body never leaks EF Core / Npgsql internals (NFR6)', async ({
    request,
  }) => {
    // GIVEN: A duplicate scenario is prepared
    const nit = uniqueNit('l');
    let firstId: string | null = null;
    try {
      const first = await request.post(CLIENTES_URL, { data: buildValidPayload({ nit }) });
      expect(first.status()).toBe(201);
      const firstDto = (await first.json()) as { id?: string };
      firstId = firstDto.id ?? null;

      // WHEN: A duplicate POST is issued
      const response = await request.post(CLIENTES_URL, {
        data: buildValidPayload({ nit, nombre: 'Duplicate Attempt' }),
      });
      expect(response.status()).toBe(409);

      // THEN: The response body contains none of the low-level DB / stack signals
      const text = await response.text();
      expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
      expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
      expect(text).not.toMatch(/Npgsql\./);
      expect(text).not.toMatch(/DbUpdateException/);
      expect(text).not.toMatch(/PostgresException/);
      expect(text).not.toMatch(/23505/);
      expect(text).not.toMatch(/uk_clientes_nit/);
      expect(text).not.toMatch(/\.cs:line \d+/);
    } finally {
      await tryDelete(request, firstId);
    }
  });

  test('[TC-Story-2.3-API-409-NoDuplicateRow] failed duplicate POST does NOT create a second row', async ({
    request,
  }) => {
    // GIVEN: A cliente exists with the target NIT
    const nit = uniqueNit('u');
    let firstId: string | null = null;
    try {
      const first = await request.post(CLIENTES_URL, { data: buildValidPayload({ nit }) });
      expect(first.status()).toBe(201);
      const firstDto = (await first.json()) as { id?: string };
      firstId = firstDto.id ?? null;

      // WHEN: A duplicate POST is attempted (rejected with 409)
      const dup = await request.post(CLIENTES_URL, {
        data: buildValidPayload({ nit, nombre: 'Duplicate Attempt' }),
      });
      expect(dup.status()).toBe(409);

      // THEN: The list still contains exactly one cliente with that NIT
      const list = await request.get(CLIENTES_URL);
      expect(list.status()).toBe(200);
      const clientes = (await list.json()) as Array<{ nit: string }>;
      const withSameNit = clientes.filter((c) => c.nit === nit);
      expect(withSameNit).toHaveLength(1);
    } finally {
      await tryDelete(request, firstId);
    }
  });
});
