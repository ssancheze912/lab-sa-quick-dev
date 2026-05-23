/**
 * Story 2.1: Client List & Search — E2E Tests (RED phase)
 *
 * Covers:
 *   AC#1 — Scrollable client list renders at /clientes with Nombre and NIT/RUC visible
 *   AC#2 — Real-time search filters by Nombre and NIT/RUC (< 1 s, NFR1)
 *   AC#3 — EmptyState when no clients exist
 *   AC#4 — ErrorPanel on fetch failure; "Reintentar" triggers refetch
 *
 * Test cases:
 *   TC-E2-P2-06  GET /api/v1/clientes returns 200 with full client list (API)
 *
 * Note: Component-level tests for TC-E2-P1-01 through TC-E2-P1-06 are in
 *   frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx
 *
 * STATUS: RED — ClienteListView, EmptyState, ErrorPanel not yet implemented.
 */

import { test, expect } from '../../fixtures/base.fixture'
import { ClientesPage } from '../../pages/clientes.page'
import { ApiHelper } from '../../helpers/api.helper'
import { buildCliente } from '../../helpers/data.helper'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-06: GET /api/v1/clientes returns 200 with full client list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P2-06 — GET /api/v1/clientes returns 200 with full client list', () => {
  test('should respond with HTTP 200 and a JSON array', async ({ request }) => {
    // GIVEN: The backend is running with the clientes endpoint registered
    // WHEN:  A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)

    // THEN: The response status is 200 OK
    expect(response.status()).toBe(200)
  })

  test('should return content-type application/json', async ({ request }) => {
    // GIVEN: The clientes endpoint is available
    // WHEN:  GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)

    // THEN: Content-Type header indicates JSON
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })

  test('should return a JSON array (not an object or null)', async ({ request }) => {
    // GIVEN: The backend has the clientes endpoint
    // WHEN:  A GET request is made
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await response.json()

    // THEN: The response body is an array
    expect(Array.isArray(body)).toBe(true)
  })

  test('should return client objects with all required camelCase fields', async ({ request }) => {
    // GIVEN: At least one client exists in the DB (created via API)
    const apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)

    // WHEN:  GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const clients = await response.json()

    // Cleanup
    await apiHelper.deleteCliente(created.id).catch(() => null)

    // THEN: At least one client is returned with all 7 required fields
    expect(clients.length).toBeGreaterThanOrEqual(1)

    const client = clients.find((c: { id: string }) => c.id === created.id)
    expect(client).toBeDefined()
    expect(client).toHaveProperty('id')
    expect(client).toHaveProperty('nombre')
    expect(client).toHaveProperty('nit')
    expect(client).toHaveProperty('telefono')
    expect(client).toHaveProperty('ciudad')
    expect(client).toHaveProperty('createdAt')
    expect(client).toHaveProperty('updatedAt')
  })

  test('should return client fields in camelCase (not snake_case)', async ({ request }) => {
    // GIVEN: A client exists
    const apiHelper = new ApiHelper(request)
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)

    // WHEN:  GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const clients = await response.json()

    const client = clients.find((c: { id: string }) => c.id === created.id)

    // Cleanup
    await apiHelper.deleteCliente(created.id).catch(() => null)

    // THEN: Fields use camelCase (not snake_case)
    expect(client).toHaveProperty('createdAt')
    expect(client).toHaveProperty('updatedAt')
    expect(client).not.toHaveProperty('created_at')
    expect(client).not.toHaveProperty('updated_at')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#1: Client list UI renders at /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Client list UI renders at /clientes', () => {
  let clientesPage: ClientesPage
  let apiHelper: ApiHelper
  const createdIds: string[] = []

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page)
    apiHelper = new ApiHelper(request)
  })

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null)
    }
    createdIds.length = 0
  })

  test('should render the clientes-list-panel at /clientes', async ({ page }) => {
    // GIVEN: The /clientes route is loaded
    // WHEN:  User navigates to /clientes
    // (network-first: intercept registered before navigation by fixture)

    await clientesPage.goto()

    // THEN: The list panel container is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()
  })

  test('should show a client item for each existing client in the system', async ({ request }) => {
    // GIVEN: 2 clients exist in the system
    const clienteA = buildCliente({ nombre: 'Empresa E2E Alpha' })
    const clienteB = buildCliente({ nombre: 'Empresa E2E Beta' })

    const createdA = await apiHelper.createCliente(clienteA)
    const createdB = await apiHelper.createCliente(clienteB)
    createdIds.push(createdA.id, createdB.id)

    // WHEN: User navigates to /clientes
    await clientesPage.goto()

    // THEN: Both clients appear in the list
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Empresa E2E Alpha' })
    ).toBeVisible()

    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Empresa E2E Beta' })
    ).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#2: Real-time search filters by Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Real-time search filters by Nombre and NIT/RUC', () => {
  let clientesPage: ClientesPage
  let apiHelper: ApiHelper
  const createdIds: string[] = []

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page)
    apiHelper = new ApiHelper(request)
  })

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null)
    }
    createdIds.length = 0
  })

  test('should filter the list when the user types in the search field (by nombre)', async () => {
    // GIVEN: 2 clients exist with distinct names
    const clienteA = buildCliente({ nombre: 'Empresa Filtro Unica' })
    const clienteB = buildCliente({ nombre: 'Otra Empresa' })

    const createdA = await apiHelper.createCliente(clienteA)
    const createdB = await apiHelper.createCliente(clienteB)
    createdIds.push(createdA.id, createdB.id)

    await clientesPage.goto()

    // Wait for list to load
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Empresa Filtro Unica' })
    ).toBeVisible()

    // WHEN: User types a distinctive search term
    await clientesPage.buscar('Filtro Unica')

    // THEN: Only matching client is visible; non-matching is hidden
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Empresa Filtro Unica' })
    ).toBeVisible()

    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Otra Empresa' })
    ).not.toBeVisible()
  })

  test('should filter the list when searching by NIT/RUC', async () => {
    // GIVEN: A client with a distinctive NIT
    const clienteNit = buildCliente({ nit: '777666555', nombre: 'Empresa NIT Search' })
    const created = await apiHelper.createCliente(clienteNit)
    createdIds.push(created.id)

    await clientesPage.goto()

    // Wait for list
    await expect(
      clientesPage.clienteItems.filter({ hasText: '777666555' })
    ).toBeVisible()

    // WHEN: User searches by NIT
    await clientesPage.buscar('777666555')

    // THEN: The matching client is visible by NIT
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Empresa NIT Search' })
    ).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#3: EmptyState when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#3 — EmptyState when no clients exist', () => {
  test('should display the EmptyState component when the client list is empty', async ({ page, request }) => {
    // GIVEN: No clients exist in the system
    // (Assumes a clean DB state — this test is most reliable in isolation)
    const apiHelper = new ApiHelper(request)
    const clientesPage = new ClientesPage(page)

    // Mock the API response to return empty array using page.route (network-first)
    await page.route('**/api/v1/clientes', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })

    // WHEN: User navigates to /clientes
    await clientesPage.goto()

    // THEN: The EmptyState is visible with the guidance message
    await expect(page.getByTestId('empty-state')).toBeVisible()
    await expect(
      page.getByText(/no hay clientes.*crea el primero/i)
    ).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#4: ErrorPanel on backend failure; "Reintentar" triggers refetch
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#4 — ErrorPanel on backend failure with Reintentar button', () => {
  test('should show ErrorPanel when the backend is unavailable', async ({ page }) => {
    // GIVEN: The backend API call fails (network error)
    // (network-first: route intercepted BEFORE goto)
    await page.route('**/api/v1/clientes', (route) => {
      void route.abort('failed')
    })

    const clientesPage = new ClientesPage(page)

    // WHEN: User navigates to /clientes and the fetch fails
    await clientesPage.goto()

    // THEN: ErrorPanel is visible with the "Reintentar" button
    await expect(page.getByTestId('error-panel')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /reintentar/i })
    ).toBeVisible()
  })

  test('should show the client list after clicking "Reintentar" and refetch succeeds', async ({ page }) => {
    // GIVEN: First fetch fails, second succeeds (network-first intercept)
    let callCount = 0
    await page.route('**/api/v1/clientes', async (route) => {
      callCount++
      if (callCount === 1) {
        await route.abort('failed')
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              nombre: 'Cliente Retry',
              nit: '900000001',
              telefono: '3001234567',
              ciudad: 'Bogotá',
              createdAt: '2026-05-01T00:00:00Z',
              updatedAt: '2026-05-01T00:00:00Z',
            },
          ]),
        })
      }
    })

    const clientesPage = new ClientesPage(page)

    // WHEN: Navigate and wait for error state
    await clientesPage.goto()
    await expect(page.getByTestId('error-panel')).toBeVisible()

    // AND WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click()

    // THEN: The client list is shown (ErrorPanel is gone)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()
    await expect(page.getByTestId('error-panel')).not.toBeVisible()
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Retry' })
    ).toBeVisible()
  })
})
