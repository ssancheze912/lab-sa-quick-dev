import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../helpers/api.helper'
import { buildCliente } from '../../helpers/data.helper'

/**
 * E2E Acceptance Tests — Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * Status: RED — Tests fail until implementation is complete.
 *
 * Covers:
 *   AC1 — Click on client item → right panel renders detail fields + URL updates to /clientes/:clienteId
 *   AC2 — Deep link /clientes/:clienteId loads client via GET /api/v1/clientes/{id} and renders detail
 *   AC3 — Non-existent clienteId → not-found message rendered gracefully, no JS error, nav shell visible
 *
 * Test cases mapped:
 *   TC-E2-P2-02 — Deep link /clientes/:id → detail renders (Playwright)
 */

test.describe('Story 2.2 — Client Detail View (E2E)', () => {
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

  // ─── AC1: Click on list item → detail panel shows client data ─────────────

  test('AC1 — GIVEN client list is displayed WHEN user clicks a client item THEN right panel renders Nombre', async ({ page }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente({ nombre: 'Empresa Click Test SA' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // GIVEN: Route interception BEFORE navigation (network-first)
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Click Test SA' }).click()

    // THEN: Right panel shows the client Nombre
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Empresa Click Test SA')
  })

  test('AC1 — GIVEN client list is displayed WHEN user clicks a client item THEN right panel renders NIT/RUC', async ({ page }) => {
    // GIVEN: A client with a known NIT
    const data = buildCliente({ nit: '900123456' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User clicks the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click()

    // THEN: Detail panel shows NIT/RUC
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('900123456')
  })

  test('AC1 — GIVEN client list is displayed WHEN user clicks a client item THEN right panel renders Teléfono', async ({ page }) => {
    // GIVEN: A client with a known phone
    const data = buildCliente({ telefono: '3009998888' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User clicks the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click()

    // THEN: Detail panel shows Teléfono
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('3009998888')
  })

  test('AC1 — GIVEN client list is displayed WHEN user clicks a client item THEN right panel renders Ciudad', async ({ page }) => {
    // GIVEN: A client with a known city
    const data = buildCliente({ ciudad: 'Cali' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User clicks the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click()

    // THEN: Detail panel shows Ciudad
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Cali')
  })

  test('AC1 — GIVEN client list is displayed WHEN user clicks a client item THEN URL updates to /clientes/:clienteId without full reload', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()

    // WHEN: User clicks the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click()

    // THEN: URL updates to /clientes/:clienteId (FR30 deep linking — no full page reload)
    await expect(page).toHaveURL(new RegExp(`/clientes/${created.id}`))
  })

  // ─── AC2: Deep link — direct URL access loads client detail ──────────────

  test('AC2 — GIVEN user accesses /clientes/:clienteId directly THEN client details are displayed in right panel', async ({ page }) => {
    // GIVEN: A client exists with known ID
    const data = buildCliente({ nombre: 'Empresa Deep Link SA' })
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: User navigates directly to the detail URL (deep link — TC-E2-P2-02)
    await page.goto(`/clientes/${created.id}`)

    // THEN: Detail panel renders the client Nombre
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Empresa Deep Link SA')
  })

  test('AC2 — GIVEN user accesses /clientes/:clienteId directly THEN client list on the left is also loaded', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: User navigates directly to the deep link
    await page.goto(`/clientes/${created.id}`)

    // THEN: Client list panel is also visible (split-panel layout)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible()
  })

  test('AC2 — GIVEN user accesses /clientes/:clienteId directly THEN the selected client is highlighted in the list', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente()
    const created = await apiHelper.createCliente(data)
    createdIds.push(created.id)

    // WHEN: User navigates via deep link
    await page.goto(`/clientes/${created.id}`)

    // THEN: The matching list item has a selected/highlighted state
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toHaveClass(/bg-blue-50|border-primary|selected/i)
  })

  // ─── AC3: Non-existent clienteId → graceful not-found ───────────────────

  test('AC3 — GIVEN clienteId does not exist WHEN page loads THEN not-found message is displayed in right panel', async ({ page }) => {
    // GIVEN: A non-existent UUID — intercept BEFORE navigation (network-first)
    await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000099', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con ID 00000000-0000-0000-0000-000000000099.',
        }),
      }),
    )

    // WHEN: User navigates to an invalid deep link
    await page.goto('/clientes/00000000-0000-0000-0000-000000000099')

    // THEN: Not-found message is displayed in the right panel
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(/cliente no encontrado/i)
  })

  test('AC3 — GIVEN clienteId does not exist WHEN page loads THEN navigation shell remains visible', async ({ page }) => {
    // GIVEN: 404 response — intercept BEFORE navigation
    await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000099', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con ID 00000000-0000-0000-0000-000000000099.',
        }),
      }),
    )

    await page.goto('/clientes/00000000-0000-0000-0000-000000000099')

    // THEN: Navigation shell (sidebar/header) remains visible
    await expect(page.getByTestId('nav-shell')).toBeVisible()
  })

  test('AC3 — GIVEN clienteId does not exist WHEN page loads THEN no uncaught JavaScript error is thrown', async ({ page }) => {
    // GIVEN: Capture console errors
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    // Intercept BEFORE navigation (network-first)
    await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000099', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con ID 00000000-0000-0000-0000-000000000099.',
        }),
      }),
    )

    // WHEN
    await page.goto('/clientes/00000000-0000-0000-0000-000000000099')
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(/cliente no encontrado/i)

    // THEN: No uncaught JS errors
    expect(jsErrors).toHaveLength(0)
  })
})
