import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../helpers/api.helper'
import { buildCliente } from '../../helpers/data.helper'

/**
 * E2E Edge-Case Tests — Story 2.2: Client Detail View
 * Epic 2: Client Management
 * Expanded by testarch-automate — covers boundary conditions and error paths
 * not present in client-detail-view.spec.ts.
 *
 * Preconditions: app running, backend reachable.
 * Route interception is set up BEFORE navigation (network-first strategy).
 */

// ─── Switching between clients ────────────────────────────────────────────

test.describe('Story 2.2 Edge — switching between clients updates detail panel', () => {
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

  test('GIVEN two clients WHEN user clicks first then second THEN detail panel updates to second client', async ({ page }) => {
    // GIVEN: Two distinct clients exist
    const data1 = buildCliente({ nombre: 'Empresa Alfa Edge SA' })
    const data2 = buildCliente({ nombre: 'Empresa Beta Edge SA' })
    const created1 = await apiHelper.createCliente(data1)
    const created2 = await apiHelper.createCliente(data2)
    createdIds.push(created1.id, created2.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: Click first client
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa Edge SA' }).click()
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Empresa Alfa Edge SA')

    // WHEN: Click second client
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Beta Edge SA' }).click()

    // THEN: Detail panel updates to second client, first is gone
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Empresa Beta Edge SA')
    await expect(page.getByTestId('cliente-detail-panel')).not.toContainText('Empresa Alfa Edge SA')
  })

  test('GIVEN two clients WHEN switching between them THEN URL reflects each clienteId', async ({ page }) => {
    // Boundary: URL must update on each selection (FR30 deep linking)
    const data1 = buildCliente({ nombre: 'URL Check Client 1' })
    const data2 = buildCliente({ nombre: 'URL Check Client 2' })
    const created1 = await apiHelper.createCliente(data1)
    const created2 = await apiHelper.createCliente(data2)
    createdIds.push(created1.id, created2.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    await page.getByTestId('cliente-list-item').filter({ hasText: 'URL Check Client 1' }).click()
    await expect(page).toHaveURL(new RegExp(`/clientes/${created1.id}`))

    await page.getByTestId('cliente-list-item').filter({ hasText: 'URL Check Client 2' }).click()
    await expect(page).toHaveURL(new RegExp(`/clientes/${created2.id}`))
  })
})

// ─── Browser back/forward navigation ─────────────────────────────────────

test.describe('Story 2.2 Edge — browser back/forward preserves URL state', () => {
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

  test('GIVEN user navigated to detail WHEN browser back is pressed THEN URL returns to /clientes', async ({ page }) => {
    // AC#1 FR30 — navigation uses TanStack Router history (no full page reload)
    const data = buildCliente({ nombre: 'Back Nav Client Edge' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Back Nav Client Edge' }).click()
    await expect(page).toHaveURL(new RegExp(`/clientes/${created.id}`))

    // WHEN: Browser back
    await page.goBack()

    // THEN: URL is /clientes (or base route), list panel visible
    await expect(page).toHaveURL(/\/clientes$/)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()
  })

  test('GIVEN user pressed back WHEN browser forward is pressed THEN detail panel is restored', async ({ page }) => {
    const data = buildCliente({ nombre: 'Forward Nav Client Edge' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Forward Nav Client Edge' }).click()
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Forward Nav Client Edge')

    await page.goBack()
    await expect(page).toHaveURL(/\/clientes$/)

    // WHEN: Forward
    await page.goForward()

    // THEN: Detail panel is shown again for same client
    await expect(page).toHaveURL(new RegExp(`/clientes/${created.id}`))
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Forward Nav Client Edge')
  })
})

// ─── Semantic HTML / accessibility in browser context ─────────────────────

test.describe('Story 2.2 Edge — detail panel semantic HTML in E2E context', () => {
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

  test('GIVEN client detail loaded WHEN panel renders THEN Nombre is in an h2 heading', async ({ page }) => {
    // AC#1 + WCAG 2.1 AA — h2 for Nombre is a spec requirement
    const data = buildCliente({ nombre: 'Heading Check Cliente' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto(`/clientes/${created.id}`)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible()

    // h2 heading contains the client Nombre
    await expect(page.locator('h2')).toContainText('Heading Check Cliente')
  })

  test('GIVEN client detail loaded WHEN panel renders THEN field labels use dt elements', async ({ page }) => {
    // WCAG 2.1 AA — semantic definition list for field/value pairs
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto(`/clientes/${created.id}`)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible()

    // dt elements present for field labels
    const dtNit = page.locator('dt', { hasText: 'NIT/RUC' })
    const dtTelefono = page.locator('dt', { hasText: 'Teléfono' })
    const dtCiudad = page.locator('dt', { hasText: 'Ciudad' })

    await expect(dtNit).toBeVisible()
    await expect(dtTelefono).toBeVisible()
    await expect(dtCiudad).toBeVisible()
  })

  test('GIVEN client detail loaded WHEN panel renders THEN retry button is NOT visible on success', async ({ page }) => {
    // Edge: retry button belongs only to the network error state
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto(`/clientes/${created.id}`)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible()

    expect(await page.getByRole('button', { name: /reintentar/i }).count()).toBe(0)
  })
})

// ─── 404 graceful degradation — boundary ─────────────────────────────────

test.describe('Story 2.2 Edge — 404 graceful degradation boundary', () => {
  test('GIVEN 404 response WHEN detail panel renders THEN retry button is NOT shown', async ({ page }) => {
    // AC#3: 404 uses not-found message, not the retry button (retry is for network errors)
    await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000088', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con ID 00000000-0000-0000-0000-000000000088.',
        }),
      }),
    )

    await page.goto('/clientes/00000000-0000-0000-0000-000000000088')
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(/cliente no encontrado/i)

    expect(await page.getByRole('button', { name: /reintentar/i }).count()).toBe(0)
  })

  test('GIVEN 404 response WHEN detail panel renders THEN secondary description is visible', async ({ page }) => {
    // Boundary: secondary text "fue eliminado" must be present alongside the title
    await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000077', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con ID 00000000-0000-0000-0000-000000000077.',
        }),
      }),
    )

    await page.goto('/clientes/00000000-0000-0000-0000-000000000077')
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(/fue eliminado/i)
  })
})

// ─── Loading skeleton visible before data arrives ─────────────────────────

test.describe('Story 2.2 Edge — skeleton visible during slow load (E2E)', () => {
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

  test('GIVEN slow API response WHEN detail begins loading THEN skeleton disappears after data arrives', async ({ page }) => {
    // State transition: skeleton → detail panel
    let resolveRoute!: (value: unknown) => void
    const routePromise = new Promise((resolve) => { resolveRoute = resolve })

    await page.route('**/api/v1/clientes/a1b2c3d4-0000-0000-0000-000000000001', async (route) => {
      await routePromise
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'a1b2c3d4-0000-0000-0000-000000000001',
          nombre: 'Ana García',
          nit: '900-111-001',
          telefono: '3001111111',
          ciudad: 'Bogotá',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      })
    })

    await page.goto('/clientes/a1b2c3d4-0000-0000-0000-000000000001')

    // WHEN: Skeleton is showing
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible()

    // Release the held response
    resolveRoute(null)

    // THEN: Skeleton disappears and detail panel appears
    await expect(page.getByTestId('cliente-detail-skeleton')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible()
  })
})
