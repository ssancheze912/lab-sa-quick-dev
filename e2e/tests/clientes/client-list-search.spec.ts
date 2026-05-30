import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../helpers/api.helper'
import { buildCliente } from '../../helpers/data.helper'

/**
 * E2E Acceptance Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Status: RED — Tests fail until implementation is complete.
 *
 * Covers:
 *   AC1 — Left panel (280px) shows scrollable list with Nombre + NIT/RUC per item
 *   AC2 — Real-time search filters by Nombre or NIT/RUC (case-insensitive, Unicode-normalized)
 *   AC3 — EmptyState displayed when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" displayed when backend is unavailable
 */

test.describe('Story 2.1 — Client List & Search (E2E)', () => {
  let apiHelper: ApiHelper
  const createdIds: string[] = []

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request)
  })

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null)
    }
    createdIds.length = 0
  })

  // ─── AC1: Left panel renders client list ──────────────────────────────────

  test('AC1 — GIVEN clients exist WHEN user navigates to /clientes THEN left panel shows the list', async ({ page }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: User navigates to /clientes (route interception before navigation)
    await page.goto('/clientes')

    // THEN: Left panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()
  })

  test('AC1 — GIVEN clients exist WHEN user navigates to /clientes THEN each item shows Nombre', async ({ page }) => {
    // GIVEN: A known client exists
    const data = buildCliente({ nombre: 'Empresa Visible SA' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: User navigates to /clientes
    await page.goto('/clientes')

    // THEN: The client Nombre is visible in the list
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visible SA' })).toBeVisible()
  })

  test('AC1 — GIVEN clients exist WHEN user navigates to /clientes THEN each item shows NIT/RUC', async ({ page }) => {
    // GIVEN: A known client with specific NIT
    const data = buildCliente({ nit: '900111222' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: User navigates to /clientes
    await page.goto('/clientes')

    // THEN: The NIT is visible in the client list item
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: '900111222' })).toBeVisible()
  })

  // ─── AC2: Real-time search by Nombre ─────────────────────────────────────

  test('AC2 — GIVEN list is loaded WHEN user types in search field THEN list filters by Nombre', async ({ page }) => {
    // GIVEN: Two distinct clients exist
    const match = buildCliente({ nombre: 'Ana García Ltda' })
    const noMatch = buildCliente({ nombre: 'Pedro Pérez SAS' })
    const c1 = await apiHelper.createCliente(match)
    const c2 = await apiHelper.createCliente(noMatch)
    createdIds.push(c1.id, c2.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User types in the search field
    await page.getByTestId('clientes-search-input').fill('Ana García')

    // THEN: Matching client is visible
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Ana García Ltda' })).toBeVisible()
  })

  test('AC2 — GIVEN list is loaded WHEN user types in search field THEN non-matching clients are hidden', async ({ page }) => {
    // GIVEN: Two distinct clients
    const match = buildCliente({ nombre: 'Ana García Ltda' })
    const noMatch = buildCliente({ nombre: 'Pedro Pérez SAS' })
    const c1 = await apiHelper.createCliente(match)
    const c2 = await apiHelper.createCliente(noMatch)
    createdIds.push(c1.id, c2.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User types a query that matches only one client
    await page.getByTestId('clientes-search-input').fill('Ana García')

    // THEN: Non-matching client is NOT visible
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Pedro Pérez SAS' })).not.toBeVisible()
  })

  test('AC2 — GIVEN list is loaded WHEN user types NIT in search field THEN list filters by NIT', async ({ page }) => {
    // GIVEN: A client with a specific NIT
    const data = buildCliente({ nit: '800456123' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User searches by NIT
    await page.getByTestId('clientes-search-input').fill('800456123')

    // THEN: The matching client is visible
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })).toBeVisible()
  })

  test('AC2 — GIVEN list is loaded WHEN user types accent-free query THEN accent-insensitive match is shown', async ({ page }) => {
    // GIVEN: A client with accented Nombre
    const data = buildCliente({ nombre: 'García López e Hijos' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User types accent-free query
    await page.getByTestId('clientes-search-input').fill('garcia lopez')

    // THEN: Accented client still appears (Unicode normalization)
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'García López e Hijos' })).toBeVisible()
  })

  // ─── AC3: EmptyState when no clients ─────────────────────────────────────

  test('AC3 — GIVEN no clients in the system WHEN user navigates to /clientes THEN EmptyState is displayed', async ({ page, request }) => {
    // GIVEN: No clients — intercept API before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    )

    // WHEN: User navigates to /clientes
    await page.goto('/clientes')

    // THEN: EmptyState component is visible
    await expect(page.getByTestId('empty-state')).toBeVisible()
  })

  test('AC3 — GIVEN no clients WHEN EmptyState renders THEN it shows a Spanish guidance message', async ({ page }) => {
    // GIVEN: Empty list intercepted before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    )

    // WHEN: User navigates to /clientes
    await page.goto('/clientes')

    // THEN: Spanish guidance message is visible
    await expect(page.getByTestId('empty-state')).toContainText(/cliente|registrado|crear/i)
  })

  // ─── AC4: ErrorPanel when backend is unavailable ─────────────────────────

  test('AC4 — GIVEN backend is unavailable WHEN page loads THEN ErrorPanel is displayed', async ({ page }) => {
    // GIVEN: Backend fails — intercept before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      }),
    )

    // WHEN: User navigates to /clientes
    await page.goto('/clientes')

    // THEN: ErrorPanel is visible instead of the list
    await expect(page.getByTestId('error-panel')).toBeVisible()
  })

  test('AC4 — GIVEN ErrorPanel is shown THEN a "Reintentar" button is visible', async ({ page }) => {
    // GIVEN: Backend fails
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      }),
    )

    await page.goto('/clientes')

    // THEN: Reintentar button is present
    await expect(page.getByTestId('retry-button')).toBeVisible()
    await expect(page.getByTestId('retry-button')).toContainText(/reintentar/i)
  })

  test('AC4 — GIVEN ErrorPanel is shown WHEN user clicks Reintentar THEN a new fetch is triggered', async ({ page }) => {
    // GIVEN: Backend fails first, then recovers
    let callCount = 0
    await page.route('**/api/v1/clientes', (route) => {
      callCount++
      if (callCount === 1) {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/clientes')
    await expect(page.getByTestId('error-panel')).toBeVisible()

    // WHEN: User clicks Reintentar
    await page.getByTestId('retry-button').click()

    // THEN: A second fetch was made (refetch called)
    await expect(page.getByTestId('error-panel')).not.toBeVisible()
  })
})
