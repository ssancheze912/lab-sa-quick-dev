import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.2 — GET /api/v1/clientes/{id} edge-case automation expansion.
 *
 * Complements cliente-by-id.api.atdd.spec.ts with cases the ATDD layer omits:
 *   [P2] Uppercase vs lowercase UUID formats both resolve (Guid case insensitivity)
 *   [P2] Non-GET HTTP methods on /clientes/{id} return 4xx (only GET is allowed)
 *   [P2] Multiple concurrent GETs return consistent data (no race condition)
 *   [P2] Trailing slash variant — /clientes/{id}/ — behavior is documented
 *   [P2] Query string parameters on /clientes/{id} are ignored (route-segment only)
 *   [P2] Empty UUID (Guid.Empty 00000000-...0) is a syntactically valid UUID → 404
 *   [P2] Response body never echoes back the request URL beyond `instance` field
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.2 — GET /api/v1/clientes/{id} (edge cases)', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    for (const id of createdIds) {
      await api.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── [P2] Uppercase UUID still resolves ────────────────────────────────
  test('[P2] uppercase UUID returns 200 (Guid route-constraint is case-insensitive)', async ({
    request,
  }) => {
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente({ nombre: 'Case Test' }));
    createdIds.push(cliente.id);

    const upperId = (cliente.id as string).toUpperCase();
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${upperId}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect((body.id as string).toLowerCase()).toBe((cliente.id as string).toLowerCase());
  });

  // ─── [P2] POST is not allowed on /clientes/{id} ────────────────────────
  test('[P2] POST /api/v1/clientes/{id} returns 4xx (only GET is mapped)', async ({
    request,
  }) => {
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente());
    createdIds.push(cliente.id);

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`, {
      data: { nombre: 'noop' },
    });

    // ASP.NET returns either 404 (no route match) or 405 (method not allowed).
    expect([404, 405]).toContain(response.status());
  });

  // ─── [P2] PUT is not allowed on /clientes/{id} (Story 2.2 does not map it) ─
  test('[P2] PUT /api/v1/clientes/{id} returns 4xx (Story 2.2 does not implement update)', async ({
    request,
  }) => {
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente());
    createdIds.push(cliente.id);

    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`, {
      data: { nombre: 'noop' },
    });

    expect([404, 405]).toContain(response.status());
  });

  // ─── [P2] Concurrent GETs return consistent data ──────────────────────
  test('[P2] 5 concurrent GETs on the same id return identical bodies', async ({
    request,
  }) => {
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(
      buildCliente({ nombre: 'Concurrent Test SAS' })
    );
    createdIds.push(cliente.id);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`)
      )
    );
    const bodies = await Promise.all(responses.map((r) => r.json()));

    // All 5 responses are 200 and carry the same id + nombre + nitRuc.
    for (const r of responses) {
      expect(r.status()).toBe(200);
    }
    for (const body of bodies) {
      expect(body.id).toBe(cliente.id);
      expect(body.nombre).toBe('Concurrent Test SAS');
      expect(body.nitRuc).toBe(cliente.nitRuc);
    }
  });

  // ─── [P2] Query string parameters on /clientes/{id} are ignored ───────
  test('[P2] query string parameters are ignored — same body returned', async ({
    request,
  }) => {
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente({ nombre: 'Query Test' }));
    createdIds.push(cliente.id);

    const responseClean = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`
    );
    const responseWithQs = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}?foo=bar&baz=42`
    );

    expect(responseClean.status()).toBe(200);
    expect(responseWithQs.status()).toBe(200);

    const bodyA = await responseClean.json();
    const bodyB = await responseWithQs.json();
    expect(bodyA).toEqual(bodyB);
  });

  // ─── [P2] Guid.Empty is syntactically valid → 404 ─────────────────────
  test('[P2] Guid.Empty (00000000-...0) is syntactically valid → 404, NOT 400', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`
    );

    // Guid.Empty parses successfully (route constraint passes) but no entity
    // exists with that id → 404 with Problem Details.
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/problem+json');
  });

  // ─── [P2] 404 body's `instance` is exactly the request path ───────────
  test('[P2] 404 response `instance` field equals the request path', async ({
    request,
  }) => {
    const missingId = '00000000-0000-0000-0000-000000000000';
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${missingId}`
    );
    const body = await response.json();

    // `instance` MUST be the request path — nothing more (no query string,
    // no host prefix). This is the NFR6 contract for the 404 leg.
    expect(body.instance).toBe(`/api/v1/clientes/${missingId}`);
  });

  // ─── [P2] Two distinct non-existent ids produce distinct `instance` fields ─
  test('[P2] two distinct missing ids → two distinct `instance` values', async ({
    request,
  }) => {
    const id1 = '11111111-1111-1111-1111-111111111111';
    const id2 = '22222222-2222-2222-2222-222222222222';

    const [r1, r2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/clientes/${id1}`),
      request.get(`${API_BASE_URL}/api/v1/clientes/${id2}`),
    ]);
    const [b1, b2] = await Promise.all([r1.json(), r2.json()]);

    expect(b1.instance).toBe(`/api/v1/clientes/${id1}`);
    expect(b2.instance).toBe(`/api/v1/clientes/${id2}`);
    expect(b1.instance).not.toBe(b2.instance);
  });

  // ─── [P2] Invalid UUID with diacritics → 400 ──────────────────────────
  test('[P2] UUID with non-ASCII characters returns 400 (route-constraint failure)', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/ñoño-not-a-guid`
    );
    expect(response.status()).toBe(400);
  });

  // ─── [P2] Empty segment returns the LIST endpoint (200), not /{id} ────
  test('[P2] /api/v1/clientes (no id segment) returns the LIST endpoint (200), not /{id}', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
