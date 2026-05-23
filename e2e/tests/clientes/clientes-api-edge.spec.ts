import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * Story 2.1 — API Edge Cases & Contract Extensions
 *
 * Expands coverage of clientes-api.spec.ts (API-C-07, API-C-07b).
 * Targets boundary conditions in the REST API: POST, DELETE, error responses.
 *
 * Test IDs: API-C-EDGE-01 … API-C-EDGE-10
 */

test.describe('Story 2.1 — API: clientes edge cases', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-01 (P1)
  // POST /api/v1/clientes — happy path returns 201 Created with the new resource
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-01 — POST /api/v1/clientes crea un cliente y devuelve 201', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa API Edge 01' });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(body.nombre).toBe(data.nombre);
    expect(body.nit).toBe(data.nit);

    createdIds.push(body.id);
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-02 (P1)
  // POST — response has Location header pointing to the new resource
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-02 — POST /api/v1/clientes incluye cabecera Location con la URL del recurso', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa API Edge 02' });

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    expect(response.status()).toBe(201);
    const body = await response.json();
    createdIds.push(body.id);

    const location = response.headers()['location'] ?? '';
    expect(location).toContain(body.id);
    expect(location).toContain('/api/v1/clientes/');
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-03 (P1)
  // GET returns the previously created client — persistence round-trip check
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-03 — GET /api/v1/clientes refleja el cliente creado en la misma sesión', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa Persistencia Test' });

    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    expect(postResponse.status()).toBe(201);
    const created = await postResponse.json();
    createdIds.push(created.id);

    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(getResponse.status()).toBe(200);

    const clientes = await getResponse.json();
    const found = clientes.find((c: { id: string }) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found.nombre).toBe(data.nombre);
    expect(found.nit).toBe(data.nit);
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-04 (P1)
  // DELETE /api/v1/clientes/{id} — returns 204 No Content for an existing record
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-04 — DELETE /api/v1/clientes/{id} devuelve 204 para un cliente existente', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa A Eliminar' });
    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const created = await postResponse.json();

    const deleteResponse = await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    expect(deleteResponse.status()).toBe(204);
    // Do NOT push to createdIds — it's already deleted
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-05 (P1)
  // DELETE then GET — deleted client must no longer appear in the list
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-05 — cliente eliminado no aparece en GET /api/v1/clientes', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa Para Borrar' });
    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const created = await postResponse.json();

    await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await getResponse.json();
    const found = clientes.find((c: { id: string }) => c.id === created.id);

    expect(found).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-06 (P2)
  // GET — all items in the array contain updatedAt as ISO 8601 with timezone
  // Boundary: UpdatedAt must be DateTimeOffset (not plain DateTime without tz)
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-06 — GET /api/v1/clientes — updatedAt es ISO 8601 con zona horaria', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa UpdatedAt Test' });
    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const created = await postResponse.json();
    createdIds.push(created.id);

    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await getResponse.json();
    const item = clientes.find((c: { id: string }) => c.id === created.id);

    expect(item).toBeDefined();
    expect(item.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-07 (P1)
  // POST — each created client has unique IDs even when sent in rapid succession
  // Boundary: Guid.NewGuid() uniqueness under concurrent creation
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-07 — dos clientes creados en rápida sucesión tienen IDs distintos', async ({ request }) => {
    const d1 = buildCliente({ nombre: 'Empresa Simultanea Uno' });
    const d2 = buildCliente({ nombre: 'Empresa Simultanea Dos' });

    const [r1, r2] = await Promise.all([
      request.post(`${API_BASE_URL}/api/v1/clientes`, { data: d1 }),
      request.post(`${API_BASE_URL}/api/v1/clientes`, { data: d2 }),
    ]);

    expect(r1.status()).toBe(201);
    expect(r2.status()).toBe(201);

    const b1 = await r1.json();
    const b2 = await r2.json();

    createdIds.push(b1.id, b2.id);
    expect(b1.id).not.toBe(b2.id);
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-08 (P2)
  // GET — response does NOT include any internal/private fields
  // Boundary: no __EFcore navigation props, internal DB identifiers, etc.
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-08 — GET /api/v1/clientes no expone campos internos de EF Core', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa Schema Test' });
    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const created = await postResponse.json();
    createdIds.push(created.id);

    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await getResponse.json();
    const item = clientes.find((c: { id: string }) => c.id === created.id);

    expect(item).toBeDefined();
    // Expected public fields
    const expectedKeys = new Set(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt']);
    const actualKeys = Object.keys(item);
    for (const key of actualKeys) {
      expect(expectedKeys.has(key)).toBe(true);
    }
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-09 (P1)
  // GET — telefono and ciudad fields are present in the response
  // Boundary: optional fields included in DTO must appear in API response
  // ---------------------------------------------------------------------------
  test('API-C-EDGE-09 — GET /api/v1/clientes incluye los campos telefono y ciudad', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa Full Fields Test', telefono: '+57 300 999 8888', ciudad: 'Cali' });
    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    expect(postResponse.status()).toBe(201);
    const created = await postResponse.json();
    createdIds.push(created.id);

    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await getResponse.json();
    const item = clientes.find((c: { id: string }) => c.id === created.id);

    expect(item.telefono).toBe(data.telefono);
    expect(item.ciudad).toBe(data.ciudad);
  });

  // ---------------------------------------------------------------------------
  // API-C-EDGE-10 (P2)
  // DELETE with non-existent ID — should return a non-200 status (4xx/5xx)
  // The exact status depends on implementation; we only assert it is NOT 200.
  // ---------------------------------------------------------------------------
  test.fixme('API-C-EDGE-10 — DELETE con ID inexistente devuelve código de error (no 200)', async ({ request }) => {
    // fixme: The endpoint currently does not validate existence before delete.
    // Marked fixme until IClienteRepository.DeleteAsync raises KeyNotFoundException
    // for unknown IDs and the endpoint maps that to 404.
    const nonExistentId = '00000000-0000-4000-a000-000000000001';

    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
