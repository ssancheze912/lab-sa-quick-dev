/**
 * E2E acceptance tests — Story 2.1: Client List & Search.
 *
 * Uses:
 * - Network-first route interception (intercept BEFORE navigation).
 * - Only data-testid selectors — no CSS/text-brittle fallbacks.
 * - No hard waits — explicit expect() polls only.
 *
 * ACs covered: #1 (280px panel + Nombre+NIT items), #2 (real-time search
 * <1s), #3 (EmptyState no-clients), #4 (search-empty), #5 (ErrorPanel + Reintentar).
 *
 * Test IDs: 2.1-E2E-001..006. Priority tags inline on each `test`.
 */
import { test, expect } from '@playwright/test'

const CLIENTES_URL = '**/api/v1/clientes'

const seededClientes = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Corporation',
    nit: '900123456',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2025-01-03T10:00:00.000Z',
    updatedAt: '2025-01-03T10:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Peña & Asociados',
    nit: '800987654',
    telefono: '3007654321',
    ciudad: 'Medellín',
    createdAt: '2025-01-02T10:00:00.000Z',
    updatedAt: '2025-01-02T10:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Global Foods S.A.',
    nit: '901555444',
    telefono: '3009998877',
    ciudad: 'Cali',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  },
]

test.describe('Story 2.1 — Client List & Search', () => {
  test('[P0][2.1-E2E-001] AC #1 — given clientes exist, when the user navigates to /clientes, then the 280px list panel renders each item with Nombre + NIT', async ({
    page,
  }) => {
    // GIVEN — intercept before navigation (network-first)
    await page.route(CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seededClientes),
      }),
    )

    // WHEN
    await page.goto('/clientes')

    // THEN — list panel present, sized 280px
    const listPanel = page.getByTestId('cliente-list-panel')
    await expect(listPanel).toBeVisible()
    const width = await listPanel.evaluate((el) => Math.round(el.getBoundingClientRect().width))
    expect(width).toBe(280)

    // THEN — each item present with Nombre + NIT
    for (const c of seededClientes) {
      const item = page.getByTestId(`cliente-list-item-${c.id}`)
      await expect(item).toBeVisible()
      await expect(item).toContainText(c.nombre)
      await expect(item).toContainText(c.nit)
    }

    // AND — the right-panel placeholder is present (AC #1: right panel exists)
    await expect(page.getByTestId('cliente-detail-empty')).toBeVisible()
  })

  test('[P0][2.1-E2E-002] AC #2 — given the list is loaded, when the user types a query, then results filter client-side without a second network call, within 1s', async ({
    page,
  }) => {
    // GIVEN
    let requestCount = 0
    await page.route(CLIENTES_URL, (route) => {
      requestCount += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seededClientes),
      })
    })

    // WHEN
    await page.goto('/clientes')
    await expect(page.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111')).toBeVisible()

    const search = page.getByTestId('cliente-search-input')
    await expect(search).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC')
    await expect(search).toHaveAttribute('aria-label', 'Buscar clientes')

    const t0 = Date.now()
    await search.fill('acme')

    // THEN — only Acme visible
    await expect(
      page.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
    ).toBeVisible()
    await expect(
      page.getByTestId('cliente-list-item-22222222-2222-2222-2222-222222222222'),
    ).toBeHidden()
    await expect(
      page.getByTestId('cliente-list-item-33333333-3333-3333-3333-333333333333'),
    ).toBeHidden()
    const elapsed = Date.now() - t0
    expect(elapsed).toBeLessThan(1000)

    // AND — no additional fetch was triggered by typing
    expect(requestCount).toBe(1)
  })

  test('[P1][2.1-E2E-003] AC #2 (diacritic tolerance) — given a client with tilde name, when the user types the ASCII form, then the item matches', async ({
    page,
  }) => {
    // GIVEN
    await page.route(CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seededClientes),
      }),
    )

    // WHEN
    await page.goto('/clientes')
    await page.getByTestId('cliente-search-input').fill('pena')

    // THEN
    await expect(
      page.getByTestId('cliente-list-item-22222222-2222-2222-2222-222222222222'),
    ).toBeVisible()
  })

  test('[P1][2.1-E2E-004] AC #3 — given no clientes exist, when /clientes loads, then the no-clients EmptyState renders', async ({
    page,
  }) => {
    // GIVEN — intercept BEFORE navigate
    await page.route(CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    )

    // WHEN
    await page.goto('/clientes')

    // THEN
    const empty = page.getByTestId('cliente-list-empty')
    await expect(empty).toBeVisible()
    await expect(empty).toContainText('No hay clientes registrados')
    await expect(empty).toContainText('Crea el primer cliente del sistema')
    await expect(empty).toHaveAttribute('aria-live', 'polite')
  })

  test('[P1][2.1-E2E-005] AC #4 — given search matches nothing, when the query is applied, then the search-empty EmptyState renders', async ({
    page,
  }) => {
    // GIVEN
    await page.route(CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seededClientes),
      }),
    )

    // WHEN
    await page.goto('/clientes')
    await page.getByTestId('cliente-search-input').fill('zzzzzz-nothing')

    // THEN
    const empty = page.getByTestId('cliente-search-empty')
    await expect(empty).toBeVisible()
    await expect(empty).toContainText('No se encontró ningún cliente')
    await expect(empty).toContainText('Intenta con otro nombre o NIT')
  })

  test('[P0][2.1-E2E-006] AC #5 — given the backend fails, when /clientes loads, then the ErrorPanel with Reintentar renders, and clicking Reintentar re-fetches and shows the list', async ({
    page,
  }) => {
    // GIVEN — first request returns 500; will swap to success on retry.
    let failNext = true
    await page.route(CLIENTES_URL, (route) => {
      if (failNext) {
        failNext = false
        return route.fulfill({ status: 500, body: 'Internal Server Error' })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seededClientes),
      })
    })

    // WHEN
    await page.goto('/clientes')

    // THEN — ErrorPanel visible with fixed Spanish copy (no raw error surfaced)
    const errorPanel = page.getByTestId('cliente-list-error')
    await expect(errorPanel).toBeVisible()
    await expect(errorPanel).toContainText('No pudimos cargar la lista de clientes.')
    await expect(errorPanel).not.toContainText(/stack|Internal Server Error/i)

    const retry = page.getByTestId('cliente-list-retry')
    await expect(retry).toBeVisible()

    // WHEN — user clicks Reintentar
    await retry.click()

    // THEN — list renders; ErrorPanel disappears
    await expect(errorPanel).toBeHidden()
    await expect(
      page.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
    ).toBeVisible()
  })
})
