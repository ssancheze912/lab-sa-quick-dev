/**
 * Story 2.4: Edit Client — Backend API Contract
 * Epic 2: Client Management
 *
 * ATDD API Contract Tests — RED Phase
 * These tests fail until the backend endpoint PUT /api/v1/clientes/{id:guid} is
 * implemented per Tasks 1-7 of the story:
 *   Domain — ClienteNotFoundException + ClienteEntity.Update + IClienteRepository.UpdateAsync
 *   Infra  — ClienteRepository.UpdateAsync (delegates to EF Core, lets 23505 bubble)
 *   App    — UpdateClienteCommand + UpdateClienteCommandHandler (maps null → 404, 23505 → 409)
 *   App    — UpdateClienteRequest + UpdateClienteRequestValidator (FluentValidation)
 *   API    — MapPut("/{id:guid}", ...) with ValidationProblem (400) + Problem (404, 409) + Ok (200)
 *
 * Acceptance Criteria covered:
 *   AC9 — PUT /api/v1/clientes/{id:guid}:
 *           → 200 OK with ClienteDto (id + createdAt preserved, updatedAt refreshed)
 *             when payload is valid and the cliente exists.
 *           → 400 Bad Request Problem Details when required fields are empty,
 *             whitespace-only, or exceed MaxLength (200/50/50/100).
 *           → 400 Bad Request when the {id} segment is not a valid Guid (route
 *             constraint {id:guid}).
 *           → 404 Not Found Problem Details when no cliente with that id exists.
 *           → 409 Conflict Problem Details when the new NIT collides with a
 *             DIFFERENT cliente row (uk_clientes_nit).
 *           → The SAME NIT on the SAME row is allowed (no 409 — the row that
 *             owns that NIT is the one being updated).
 *   AC5 / NFR6 — 409 body never leaks stack traces, EF Core, Npgsql, or
 *                Postgres SqlState / ConstraintName internals.
 *
 * Mapped to _bmad-output/test-design-epic-2.md:
 *   P0#7  — Each mutation invalidates ['clientes'] and ['clientes', id]
 *   P0#9  — Required fields validation returns 400
 *   P1#10 — PUT /clientes/{id} updates only mutable fields; created_at unchanged
 *   R-002 — Duplicate NIT mitigation at API level
 *   R-011 — Exact copy of error messages / no leak
 *
 * Setup:
 *   Uses the running backend at http://localhost:5000 (API_BASE_URL). Each test
 *   that needs a seed creates one via POST and cleans it up in a finally block.
 *   NITs are randomised per test to avoid parallel-run collisions on
 *   uk_clientes_nit.
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
  return `900${Date.now().toString().slice(-6)}${seed}-4`.slice(0, 20);
}

function buildValidCreatePayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nombre: 'ATDD Story 2.4 Cliente',
    nit: uniqueNit('a'),
    telefono: '+57 300 555 0000',
    ciudad: 'Medellín',
    ...overrides,
  };
}

function buildValidUpdatePayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nombre: 'ATDD Story 2.4 Cliente Updated',
    nit: uniqueNit('u'),
    telefono: '+57 300 999 0000',
    ciudad: 'Cali',
    ...overrides,
  };
}

async function seedCliente(
  request: APIRequestContext,
  overrides: Partial<Record<string, unknown>> = {},
): Promise<{ id: string; body: Record<string, unknown> }> {
  const payload = buildValidCreatePayload(overrides);
  const response = await request.post(CLIENTES_URL, { data: payload });
  expect(response.status()).toBe(201);
  const dto = (await response.json()) as Record<string, unknown>;
  const id = String(dto.id ?? '');
  expect(id).toMatch(UUID_REGEX);
  return { id, body: dto };
}

async function tryDelete(request: APIRequestContext, id: string | null | undefined) {
  if (!id) return;
  await request.delete(`${CLIENTES_URL}/${id}`).catch(() => undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — [TC-Story-2.4-API-200] PUT /api/v1/clientes/{id} → 200 with updated DTO
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — PUT /api/v1/clientes/{id} contract (happy path)', () => {
  test('[TC-Story-2.4-API-200] valid payload returns 200 with the updated ClienteDto', async ({
    request,
  }) => {
    // GIVEN: A cliente exists in the database
    const seed = await seedCliente(request, { nit: uniqueNit('s1') });
    try {
      const updatePayload = buildValidUpdatePayload({ nit: seed.body.nit as string });

      // WHEN: The client PUTs an updated payload for the same id
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: updatePayload,
      });

      // THEN: The server returns 200 with the freshly persisted DTO
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const dto = (await response.json()) as Record<string, unknown>;
      expect(dto).toMatchObject({
        id: seed.id,
        nombre: updatePayload.nombre,
        nit: updatePayload.nit,
        telefono: updatePayload.telefono,
        ciudad: updatePayload.ciudad,
      });

      // AND: id echoes the URL segment (server never accepts a PK change)
      expect(dto.id).toBe(seed.id);

      // AND: No PascalCase leak from .NET default serialization
      expect(Object.keys(dto)).not.toContain('Id');
      expect(Object.keys(dto)).not.toContain('Nombre');
      expect(Object.keys(dto)).not.toContain('CreatedAt');
    } finally {
      await tryDelete(request, seed.id);
    }
  });

  test('[TC-Story-2.4-API-200-Preserves-CreatedAt] updatedAt refreshes but createdAt stays the same', async ({
    request,
  }) => {
    // GIVEN: A freshly created cliente with a known createdAt
    const seed = await seedCliente(request, { nit: uniqueNit('s2') });
    try {
      const originalCreatedAt = String(seed.body.createdAt);
      const originalUpdatedAt = String(seed.body.updatedAt);
      expect(originalCreatedAt).toMatch(ISO_8601_REGEX);

      // WHEN: The client PUTs a change (with an intentional short delay to
      // guarantee a different UpdatedAt value on the server clock)
      await new Promise((resolve) => setTimeout(resolve, 25));
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: buildValidUpdatePayload({ nit: seed.body.nit as string }),
      });
      expect(response.status()).toBe(200);
      const dto = (await response.json()) as Record<string, unknown>;

      // THEN: createdAt is immutable
      expect(dto.createdAt).toBe(originalCreatedAt);
      // AND: updatedAt was refreshed by the server
      expect(String(dto.updatedAt)).toMatch(ISO_8601_REGEX);
      expect(dto.updatedAt).not.toBe(originalUpdatedAt);
    } finally {
      await tryDelete(request, seed.id);
    }
  });

  test('[TC-Story-2.4-API-200-RoundTrip] a subsequent GET returns the updated DTO', async ({
    request,
  }) => {
    // GIVEN: A cliente exists
    const seed = await seedCliente(request, { nit: uniqueNit('s3') });
    try {
      const updatePayload = buildValidUpdatePayload({ nit: seed.body.nit as string });

      // WHEN: The client PUTs then GETs the same id
      const put = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: updatePayload,
      });
      expect(put.status()).toBe(200);

      const fetched = await request.get(`${CLIENTES_URL}/${seed.id}`);
      expect(fetched.status()).toBe(200);
      const body = (await fetched.json()) as Record<string, unknown>;

      // THEN: The GET body matches the PUT payload
      expect(body).toMatchObject({
        id: seed.id,
        nombre: updatePayload.nombre,
        nit: updatePayload.nit,
        telefono: updatePayload.telefono,
        ciudad: updatePayload.ciudad,
      });
    } finally {
      await tryDelete(request, seed.id);
    }
  });

  test('[TC-Story-2.4-API-200-Trim] server trims all four string fields before persisting', async ({
    request,
  }) => {
    // GIVEN: A cliente exists
    const seed = await seedCliente(request, { nit: uniqueNit('s4') });
    try {
      const trimmedNit = uniqueNit('trim');
      const untrimmedPayload = {
        nombre: '  Trimmed Update  ',
        nit: `  ${trimmedNit}  `,
        telefono: '  +57 300 111 0000  ',
        ciudad: '  Cali  ',
      };

      // WHEN: The client PUTs a payload with surrounding whitespace
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: untrimmedPayload,
      });
      expect(response.status()).toBe(200);
      const dto = (await response.json()) as Record<string, unknown>;

      // THEN: The persisted values are trimmed
      expect(dto.nombre).toBe('Trimmed Update');
      expect(dto.nit).toBe(trimmedNit);
      expect(dto.telefono).toBe('+57 300 111 0000');
      expect(dto.ciudad).toBe('Cali');
    } finally {
      await tryDelete(request, seed.id);
    }
  });

  test('[TC-Story-2.4-API-200-SameNit] PUTting the same NIT as the current cliente does NOT return 409', async ({
    request,
  }) => {
    // GIVEN: A cliente exists with a specific NIT
    const nit = uniqueNit('same');
    const seed = await seedCliente(request, { nit });
    try {
      // WHEN: The client PUTs an update reusing the same NIT (only phone/ciudad change)
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: {
          nombre: 'Same Nit Update',
          nit,
          telefono: '+57 300 000 0000',
          ciudad: 'Barranquilla',
        },
      });

      // THEN: The server returns 200 — the unique index is not violated because
      // the row owning that NIT is the same one being updated (AC5 corollary)
      expect(response.status()).toBe(200);
      const dto = (await response.json()) as Record<string, unknown>;
      expect(dto.nit).toBe(nit);
      expect(dto.telefono).toBe('+57 300 000 0000');
    } finally {
      await tryDelete(request, seed.id);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — [TC-Story-2.4-API-400] Empty / whitespace / MaxLength → 400 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — PUT /api/v1/clientes/{id} rejects invalid payloads with 400 Problem Details', () => {
  test('[TC-Story-2.4-API-400-EmptyNombre] empty Nombre returns 400 with errors.nombre', async ({
    request,
  }) => {
    // GIVEN: A cliente exists
    const seed = await seedCliente(request, { nit: uniqueNit('v1') });
    try {
      // WHEN: The client PUTs with empty Nombre
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: {
          nombre: '',
          nit: seed.body.nit,
          telefono: '+57 300 000 0000',
          ciudad: 'Cali',
        },
      });

      // THEN: 400 with application/problem+json + errors.nombre key
      expect(response.status()).toBe(400);
      expect(response.headers()['content-type']).toContain('application/problem+json');

      const problem = (await response.json()) as {
        errors?: Record<string, string[]>;
        status?: number;
      };
      expect(problem.status).toBe(400);
      const errorsKeys = Object.keys(problem.errors ?? {}).map((k) => k.toLowerCase());
      expect(errorsKeys).toContain('nombre');
    } finally {
      await tryDelete(request, seed.id);
    }
  });

  test('[TC-Story-2.4-API-400-WhitespaceAll] whitespace-only fields → 400 with all 4 error keys', async ({
    request,
  }) => {
    // GIVEN: A cliente exists
    const seed = await seedCliente(request, { nit: uniqueNit('v2') });
    try {
      // WHEN: The client PUTs with all 4 fields set to whitespace
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: {
          nombre: '   ',
          nit: '\t  ',
          telefono: '  ',
          ciudad: ' \n ',
        },
      });

      // THEN: 400 with errors containing all four field keys
      expect(response.status()).toBe(400);
      const problem = (await response.json()) as {
        errors?: Record<string, string[]>;
      };
      const errorsKeys = Object.keys(problem.errors ?? {}).map((k) => k.toLowerCase());
      expect(errorsKeys).toEqual(
        expect.arrayContaining(['nombre', 'nit', 'telefono', 'ciudad']),
      );
    } finally {
      await tryDelete(request, seed.id);
    }
  });

  test('[TC-Story-2.4-API-400-NitMaxLength] NIT > 50 chars returns 400 with MaxLength error', async ({
    request,
  }) => {
    // GIVEN: A cliente exists
    const seed = await seedCliente(request, { nit: uniqueNit('v3') });
    try {
      // WHEN: The client PUTs with a 51-char NIT
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: {
          nombre: 'Nombre válido',
          nit: 'A'.repeat(51),
          telefono: '+57 300 000 0000',
          ciudad: 'Cali',
        },
      });

      // THEN: 400 with a nit error key
      expect(response.status()).toBe(400);
      const problem = (await response.json()) as { errors?: Record<string, string[]> };
      const errorsKeys = Object.keys(problem.errors ?? {}).map((k) => k.toLowerCase());
      expect(errorsKeys).toContain('nit');
    } finally {
      await tryDelete(request, seed.id);
    }
  });

  test('[TC-Story-2.4-API-400-InvalidGuid] non-GUID id segment returns 400 (route constraint)', async ({
    request,
  }) => {
    // GIVEN: The route uses the {id:guid} constraint
    // WHEN: The client PUTs to a non-GUID id
    const response = await request.put(`${CLIENTES_URL}/not-a-guid`, {
      data: buildValidUpdatePayload(),
    });

    // THEN: The framework returns 400 before touching the handler
    expect(response.status()).toBe(400);
    const text = await response.text();
    // AND: No stack trace signals leak (NFR6)
    expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(text).not.toMatch(/\.cs:line \d+/);
  });

  test('[TC-Story-2.4-API-400-NoStackTrace] 400 body must not contain stack-trace signals (NFR6)', async ({
    request,
  }) => {
    // GIVEN: A cliente exists and an empty-Nombre payload triggers 400
    const seed = await seedCliente(request, { nit: uniqueNit('v4') });
    try {
      const response = await request.put(`${CLIENTES_URL}/${seed.id}`, {
        data: {
          nombre: '',
          nit: seed.body.nit,
          telefono: '+57 300 000 0000',
          ciudad: 'Cali',
        },
      });
      expect(response.status()).toBe(400);

      // THEN: The 400 response body contains no stack-trace signals
      const text = await response.text();
      expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
      expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
      expect(text).not.toMatch(/\.cs:line \d+/);
      expect(text).not.toMatch(/Npgsql\./);
    } finally {
      await tryDelete(request, seed.id);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — [TC-Story-2.4-API-404] Unknown id → 404 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — PUT /api/v1/clientes/{id} returns 404 when the cliente does not exist', () => {
  test('[TC-Story-2.4-API-404] unknown GUID returns 404 with expected copy', async ({
    request,
  }) => {
    // GIVEN: A GUID that doesn't map to any cliente
    const unknownId = '00000000-0000-0000-0000-000000000000';

    // WHEN: The client PUTs a valid payload targeting the missing id
    const response = await request.put(`${CLIENTES_URL}/${unknownId}`, {
      data: buildValidUpdatePayload(),
    });

    // THEN: Status is 404 with Problem Details
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/problem+json');
    const problem = (await response.json()) as Record<string, unknown>;
    expect(problem.status).toBe(404);
    expect(problem.title).toBe('Cliente no encontrado');
  });

  test('[TC-Story-2.4-API-404-NoLeak] 404 body never leaks stack traces or EF Core internals (NFR6)', async ({
    request,
  }) => {
    // GIVEN: A GUID that doesn't map to any cliente
    const unknownId = '00000000-0000-0000-0000-000000000000';

    // WHEN: The client PUTs a valid payload
    const response = await request.put(`${CLIENTES_URL}/${unknownId}`, {
      data: buildValidUpdatePayload(),
    });
    expect(response.status()).toBe(404);

    // THEN: The 404 body contains no low-level signals
    const text = await response.text();
    expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(text).not.toMatch(/Npgsql\./);
    expect(text).not.toMatch(/\.cs:line \d+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 / AC5 — [TC-Story-2.4-API-409] Duplicate NIT (different row) → 409
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 / AC5 — PUT /api/v1/clientes/{id} returns 409 when NIT collides with a DIFFERENT row', () => {
  test('[TC-Story-2.4-API-409-Duplicate] updating cliente A with cliente B\'s NIT returns 409 with expected copy', async ({
    request,
  }) => {
    // GIVEN: Two distinct clientes exist with different NITs
    const nitA = uniqueNit('a');
    const nitB = uniqueNit('b');
    const seedA = await seedCliente(request, { nit: nitA });
    let seedBId: string | null = null;
    try {
      const seedB = await seedCliente(request, { nit: nitB });
      seedBId = seedB.id;

      // WHEN: The client PUTs cliente A trying to use cliente B's NIT
      const response = await request.put(`${CLIENTES_URL}/${seedA.id}`, {
        data: {
          nombre: 'Duplicate Attempt',
          nit: nitB,
          telefono: '+57 300 000 0000',
          ciudad: 'Cali',
        },
      });

      // THEN: Status is 409 Conflict with Problem Details body
      expect(response.status()).toBe(409);
      expect(response.headers()['content-type']).toContain('application/problem+json');

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
      await tryDelete(request, seedA.id);
      await tryDelete(request, seedBId);
    }
  });

  test('[TC-Story-2.4-API-409-NoLeak] 409 body never leaks EF Core / Npgsql / SqlState (NFR6)', async ({
    request,
  }) => {
    // GIVEN: Two clientes with distinct NITs
    const nitA = uniqueNit('la');
    const nitB = uniqueNit('lb');
    const seedA = await seedCliente(request, { nit: nitA });
    let seedBId: string | null = null;
    try {
      const seedB = await seedCliente(request, { nit: nitB });
      seedBId = seedB.id;

      // WHEN: We collide on B's NIT from A's row
      const response = await request.put(`${CLIENTES_URL}/${seedA.id}`, {
        data: {
          nombre: 'Duplicate Attempt',
          nit: nitB,
          telefono: '+57 300 000 0000',
          ciudad: 'Cali',
        },
      });
      expect(response.status()).toBe(409);

      // THEN: The body has none of the low-level DB / stack signals
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
      await tryDelete(request, seedA.id);
      await tryDelete(request, seedBId);
    }
  });

  test('[TC-Story-2.4-API-409-NoPersist] failed duplicate PUT does NOT overwrite cliente A', async ({
    request,
  }) => {
    // GIVEN: Two clientes exist
    const nitA = uniqueNit('pa');
    const nitB = uniqueNit('pb');
    const seedA = await seedCliente(request, { nit: nitA });
    let seedBId: string | null = null;
    try {
      const seedB = await seedCliente(request, { nit: nitB });
      seedBId = seedB.id;

      // WHEN: The duplicate PUT is rejected with 409
      const dup = await request.put(`${CLIENTES_URL}/${seedA.id}`, {
        data: {
          nombre: 'Should Not Persist',
          nit: nitB,
          telefono: '+57 300 999 9999',
          ciudad: 'Cartagena',
        },
      });
      expect(dup.status()).toBe(409);

      // THEN: Cliente A still has its ORIGINAL NIT and nombre — rollback verified
      const fetched = await request.get(`${CLIENTES_URL}/${seedA.id}`);
      expect(fetched.status()).toBe(200);
      const body = (await fetched.json()) as Record<string, unknown>;
      expect(body.nit).toBe(nitA);
      expect(body.nombre).not.toBe('Should Not Persist');
    } finally {
      await tryDelete(request, seedA.id);
      await tryDelete(request, seedBId);
    }
  });
});
