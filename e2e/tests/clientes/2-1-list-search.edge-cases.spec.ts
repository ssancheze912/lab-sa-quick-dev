/**
 * E2E edge-case tests — Story 2.1: Client List & Search.
 *
 * Expands the ATDD suite (which covers the happy paths for each AC) with
 * user-observable edge cases pulled from test-design-epic-2 §4.1–4.3:
 *
 *   [P1] Clearing the search input restores the full list (AC #2 round-trip)
 *   [P1] Detail panel placeholder remains visible during error state (AC #1 + #5)
 *   [P2] NIT-only search filters the list by NIT substring (AC #2)
 *   [P2] Special / regex-like query characters do not crash the filter
 *
 * Network-first pattern (intercept BEFORE navigation). data-testid selectors only.
 * No hard waits.
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

test.describe('Story 2.1 — Client List & Search (edge cases)', () => {
  test('[P1] AC #2 round-trip — given the user has filtered the list, when the input is cleared, then all clientes reappear', async ({
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
    await page.goto('/clientes')
    const search = page.getByTestId('cliente-search-input')
    await expect(
      page.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
    ).toBeVisible()

    // WHEN — filter to just Acme
    await search.fill('acme')
    await expect(
      page.getByTestId('cliente-list-item-22222222-2222-2222-2222-222222222222'),
    ).toBeHidden()

    // AND — clear
    await search.fill('')

    // THEN — all three items are visible again
    for (const c of seededClientes) {
      await expect(page.getByTestId(`cliente-list-item-${c.id}`)).toBeVisible()
    }
  })

  test('[P1] AC #1 + #5 — given the API fails, when the error state renders, then the right-panel placeholder is still visible', async ({
    page,
  }) => {
    // GIVEN — API returns 500
    await page.route(CLIENTES_URL, (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    )

    // WHEN
    await page.goto('/clientes')

    // THEN — ErrorPanel visible in the left panel
    await expect(page.getByTestId('cliente-list-error')).toBeVisible()

    // AND — the right-panel placeholder (Story 2.2 stub) remains present
    await expect(page.getByTestId('cliente-detail-empty')).toBeVisible()
  })

  test('[P2] AC #2 — given the user searches by an NIT substring only, when the query is applied, then only the matching cliente remains visible', async ({
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
    await page.goto('/clientes')
    await expect(
      page.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
    ).toBeVisible()

    // WHEN — "800987" only appears in Peña's NIT
    await page.getByTestId('cliente-search-input').fill('800987')

    // THEN
    await expect(
      page.getByTestId('cliente-list-item-22222222-2222-2222-2222-222222222222'),
    ).toBeVisible()
    await expect(
      page.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
    ).toBeHidden()
    await expect(
      page.getByTestId('cliente-list-item-33333333-3333-3333-3333-333333333333'),
    ).toBeHidden()
  })

  test('[P2] AC #2 — given a regex-like query, when applied, then the filter treats it as a literal substring and does not crash', async ({
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
    await page.goto('/clientes')
    await expect(
      page.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
    ).toBeVisible()

    // WHEN — regex-like meta chars in query
    await page.getByTestId('cliente-search-input').fill('.*')

    // THEN — page still responsive: search-empty state is shown; app still mounted
    await expect(page.getByTestId('cliente-search-empty')).toBeVisible()
    // Sanity: shell + right panel still rendered (no crash)
    await expect(page.getByTestId('cliente-detail-empty')).toBeVisible()
  })
})
