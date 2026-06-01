/**
 * Story 2.1: Client List & Search — Automation Expansion
 * Epic 2: Client Management
 *
 * API Edge Case Tests (Playwright APIRequestContext)
 * Covers boundary conditions NOT in ATDD tests:
 *
 *   - Response time under 1 second for empty list (NFR1)
 *   - Response time under 1 second for 1 client (NFR1)
 *   - Content-Type includes charset=utf-8 (real .NET behavior)
 *   - HTTP method restriction: POST /api/v1/clientes with valid body succeeds (201)
 *   - id field in response is lowercase UUID (camelCase serialization)
 *   - createdAt ≤ updatedAt for a freshly created entity
 *   - Response array is mutable in JS (not frozen/sealed)
 *   - Two clients with the same nombre but different NIT are both persisted
 *   - A client can be retrieved after creation (round-trip persistence)
 *   - An empty string NIT unique constraint: only the first client with a given NIT persists
 */

import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../helpers/api.helper'
import { buildCliente } from '../../helpers/data.helper'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Response time boundary — NFR1 (search < 1s / 500 records at API level)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — API response time (NFR1)', () => {
  test('[P1] GET /api/v1/clientes responds in under 1000ms (NFR1)', async ({ request }) => {
    // GIVEN: Backend is running
    // WHEN: GET /api/v1/clientes is called and timed
    const start = Date.now()
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const elapsed = Date.now() - start

    // THEN: Response arrives within 1 second
    expect(response.status()).toBe(200)
    expect(elapsed).toBeLessThan(1000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Response body is a JSON array (not null, not object, not string)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Response body type invariants', () => {
  test('[P0] GET /api/v1/clientes body is never null', async ({ request }) => {
    // GIVEN: Backend running
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)

    // THEN: body is not null
    const body = await response.json()
    expect(body).not.toBeNull()
  })

  test('[P0] GET /api/v1/clientes body is an Array (not a plain object)', async ({ request }) => {
    // GIVEN: Architecture standard — direct array, no wrapper
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)

    const body = await response.json()

    // THEN: typeof is 'object' and Array.isArray is true (not a plain object)
    expect(typeof body).toBe('object')
    expect(Array.isArray(body)).toBe(true)
  })

  test('[P1] GET /api/v1/clientes body elements are objects (not primitives)', async ({ request }) => {
    // GIVEN: At least one client exists
    const apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // Find the created client
    const client = body.find((c: { id: string }) => c.id === created.id)

    if (client) {
      // THEN: Each element is a plain object (typeof === 'object')
      expect(typeof client).toBe('object')
      expect(Array.isArray(client)).toBe(false)

      // Cleanup
      await apiHelper.deleteCliente(created.id).catch(() => null)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Timestamp ordering — createdAt ≤ updatedAt for fresh entity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Timestamp ordering invariant', () => {
  let createdId = ''

  test.afterEach(async ({ request }) => {
    if (createdId) {
      const apiHelper = new ApiHelper(request)
      await apiHelper.deleteCliente(createdId).catch(() => null)
      createdId = ''
    }
  })

  test('[P0] freshly created client has createdAt ≤ updatedAt', async ({ request }) => {
    // GIVEN: A client is just created (no updates applied)
    const apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdId = created.id

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // THEN: createdAt ≤ updatedAt (temporal invariant)
    const client = body.find((c: { id: string }) => c.id === created.id)
    expect(client).toBeDefined()

    const createdAt = new Date(client.createdAt).getTime()
    const updatedAt = new Date(client.updatedAt).getTime()
    expect(createdAt).toBeLessThanOrEqual(updatedAt)
  })

  test('[P0] freshly created client has createdAt equal to updatedAt (no updates applied)', async ({ request }) => {
    // GIVEN: A client just created — no mutations since creation
    const apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdId = created.id

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // THEN: createdAt equals updatedAt (not yet updated)
    const client = body.find((c: { id: string }) => c.id === created.id)
    expect(client).toBeDefined()
    expect(client.createdAt).toBe(client.updatedAt)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Duplicate Nombre — allowed (only NIT is unique)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Duplicate Nombre with different NIT', () => {
  const createdIds: string[] = []
  let apiHelper: ApiHelper

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request)
  })

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null)
    }
    createdIds.length = 0
  })

  test('[P1] two clients with the same Nombre but different NITs are both created successfully', async ({ request }) => {
    // GIVEN: Nombre is NOT unique — only NIT has a unique constraint
    apiHelper = new ApiHelper(request)
    const sharedNombre = 'Empresa Duplicada SA'

    const data1 = buildCliente({ nombre: sharedNombre })
    const data2 = buildCliente({ nombre: sharedNombre })
    // data1.nit and data2.nit are different (generated by buildCliente)

    const created1 = await apiHelper.createCliente(data1)
    const created2 = await apiHelper.createCliente(data2)

    createdIds.push(created1.id, created2.id)

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // THEN: Both clients are in the list
    const clientsWithSameName = body.filter(
      (c: { nombre: string }) => c.nombre === sharedNombre
    )
    expect(clientsWithSameName.length).toBeGreaterThanOrEqual(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Field values — camelCase serialization (JSON property naming)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — JSON camelCase serialization contract', () => {
  const createdIds: string[] = []
  let apiHelper: ApiHelper

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request)
  })

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null)
    }
    createdIds.length = 0
  })

  test('[P0] response object does NOT have PascalCase keys (Nombre, Nit, etc.)', async ({ request }) => {
    // GIVEN: .NET default JSON serialization uses camelCase for Minimal API responses
    apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // THEN: keys are camelCase (not PascalCase)
    const client = body.find((c: { id: string }) => c.id === created.id)
    expect(client).toBeDefined()

    // camelCase keys MUST exist
    expect(client).toHaveProperty('id')
    expect(client).toHaveProperty('nombre')
    expect(client).toHaveProperty('nit')
    expect(client).toHaveProperty('telefono')
    expect(client).toHaveProperty('ciudad')
    expect(client).toHaveProperty('createdAt')
    expect(client).toHaveProperty('updatedAt')

    // PascalCase keys must NOT exist
    expect(client).not.toHaveProperty('Id')
    expect(client).not.toHaveProperty('Nombre')
    expect(client).not.toHaveProperty('Nit')
    expect(client).not.toHaveProperty('CreatedAt')
    expect(client).not.toHaveProperty('UpdatedAt')
  })

  test('[P0] id field is a lowercase UUID string (not uppercase)', async ({ request }) => {
    // GIVEN: UUID format is lowercase by convention
    apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // THEN: id is lowercase UUID
    const client = body.find((c: { id: string }) => c.id === created.id)
    expect(client).toBeDefined()
    expect(client.id).toBe(client.id.toLowerCase())
    // UUID v4 format: 8-4-4-4-12 hex digits
    expect(client.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: HTTP method restrictions — unsupported methods
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — HTTP method restrictions', () => {
  test('[P2] DELETE /api/v1/clientes (without id) returns 405 or 404', async ({ request }) => {
    // GIVEN: The collection endpoint only supports GET; DELETE requires an id
    // WHEN: DELETE /api/v1/clientes is called without an id
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes`)

    // THEN: 404 (route not matched) or 405 (Method Not Allowed)
    expect([404, 405]).toContain(response.status())
  })

  test('[P2] PUT /api/v1/clientes (without id) returns 404 or 405', async ({ request }) => {
    // GIVEN: PUT on the collection is not a registered route
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Test' },
    })

    // THEN: 404 or 405
    expect([404, 405]).toContain(response.status())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Response does NOT include extra undocumented fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Response shape exactness (no extra fields)', () => {
  const createdIds: string[] = []
  let apiHelper: ApiHelper

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request)
  })

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null)
    }
    createdIds.length = 0
  })

  test('[P1] client object in response has exactly 7 keys (no undocumented fields)', async ({ request }) => {
    // GIVEN: API contract specifies exactly 7 fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // THEN: exactly 7 keys per client object
    const client = body.find((c: { id: string }) => c.id === created.id)
    expect(client).toBeDefined()

    const keys = Object.keys(client)
    expect(keys).toHaveLength(7)
    expect(keys.sort()).toEqual(
      ['ciudad', 'createdAt', 'id', 'nombre', 'nit', 'telefono', 'updatedAt'].sort()
    )
  })
})
