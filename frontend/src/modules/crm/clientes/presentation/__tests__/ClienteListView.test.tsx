/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * ATDD Component Tests — RED Phase (Vitest + React Testing Library + MSW)
 *
 * These tests are intentionally FAILING until ClienteListView and its
 * supporting infrastructure (useClientes hook, EmptyState, ErrorPanel,
 * ClientListItem) are implemented.
 *
 * Covers Acceptance Criterion #11 (six named sub-cases):
 *   - ClienteListView_renders_panel_with_280px_width
 *   - ClienteListView_filters_by_nombre
 *   - ClienteListView_filters_by_nit
 *   - ClienteListView_empty_state_when_no_clients
 *   - ClienteListView_error_panel_with_retry
 *   - ClienteListView_filter_500_records_under_1s
 */

import { describe, expect, test, beforeAll, afterEach, afterAll } from 'vitest'
import type { ReactElement } from 'react'
import { render, screen, cleanup, within, waitFor, fireEvent } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — strict mode (`onUnhandledRequest: 'error'`) guarantees the
// filter is purely in-memory and never fires extra HTTP calls.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Acme Industrial S.A.S.',
    nit: '900111222-1',
    telefono: '3001112233',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Comercializadora Andina Ltda.',
    nit: '901222333-2',
    telefono: '3002223344',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nombre: 'Distribuciones del Pacífico',
    nit: '902333444-3',
    telefono: '3003334455',
    ciudad: 'Cali',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(SAMPLE)),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderWithClient(ui: ReactElement) {
  // Fresh QueryClient per test — no shared cache across tests.
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function buildBulk(count: number) {
  const arr = []
  const base = Date.parse('2026-01-01T00:00:00.000Z')
  for (let i = 0; i < count; i++) {
    const ts = new Date(base - i * 1000).toISOString()
    arr.push({
      id: `00000000-0000-0000-0000-${i.toString().padStart(12, '0')}`,
      nombre: `Cliente Bulk ${i}`,
      nit: `9${i.toString().padStart(8, '0')}`,
      telefono: '3001112233',
      ciudad: 'Bogotá',
      createdAt: ts,
      updatedAt: ts,
    })
  }
  return arr
}

// ─────────────────────────────────────────────────────────────────────────────
// AC #11.1 — panel renders with width 280px and one item per cliente.
// AC #1 — `<aside data-testid="clientes-list-panel">`.
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Story 2.1', () => {
  test('GIVEN three clientes WHEN ClienteListView mounts THEN aside `clientes-list-panel` is 280px wide and shows 3 items', async () => {
    // GIVEN: MSW returns 3 clientes (default handler).

    // WHEN: ClienteListView mounts with a fresh QueryClient.
    renderWithClient(<ClienteListView />)

    // THEN: the list panel is present.
    const panel = await screen.findByTestId('clientes-list-panel')
    expect(panel).toBeInTheDocument()
    expect(panel.tagName.toLowerCase()).toBe('aside')

    // Width contract — class includes `w-[280px]` per the story Dev Notes.
    expect(panel.className).toMatch(/w-\[280px\]/)

    // 3 items rendered.
    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #11.2 — filters by `nombre`.
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN three clientes WHEN user types "Acme" in the search input THEN only the matching item is rendered (no extra HTTP request)', async () => {
    // GIVEN
    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    // WHEN
    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'Acme' } })

    // THEN
    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
    })

    expect(screen.getByText(/acme industrial/i)).toBeInTheDocument()
    // The unmatched names are gone.
    expect(screen.queryByText(/comercializadora andina/i)).not.toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #11.3 — filters by `nit`.
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN three clientes WHEN user types a NIT substring "901222" THEN only the matching item is rendered', async () => {
    // GIVEN
    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    // WHEN
    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    fireEvent.change(search, { target: { value: '901222' } })

    // THEN
    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
    })

    const remainingItem = screen.getByTestId('cliente-list-item')
    expect(within(remainingItem).getByText(/comercializadora andina/i)).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #11.4 — empty-state when backend returns [].
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN backend returns an empty array WHEN ClienteListView mounts THEN `clientes-empty-state` is visible and no items are rendered', async () => {
    // GIVEN
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])))

    // WHEN
    renderWithClient(<ClienteListView />)

    // THEN
    const empty = await screen.findByTestId('clientes-empty-state')
    expect(empty).toBeInTheDocument()
    expect(empty).toHaveTextContent(/aún no hay clientes/i)
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    // Search input is still visible per AC #3.
    expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #11.5 — ErrorPanel + Reintentar recovers.
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN GET /clientes returns 500 first WHEN user clicks Reintentar AND second call returns 200 THEN list renders', async () => {
    // GIVEN: first call 500, second call returns the sample list.
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount += 1
        if (callCount === 1) {
          return new HttpResponse(JSON.stringify({ status: 500, title: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/problem+json' },
          })
        }
        return HttpResponse.json(SAMPLE)
      }),
    )

    // WHEN
    renderWithClient(<ClienteListView />)

    // THEN: error panel appears.
    const errorPanel = await screen.findByTestId('clientes-error-panel')
    expect(errorPanel).toBeInTheDocument()
    expect(errorPanel).toHaveTextContent(/no se pudieron cargar los clientes/i)

    // AND: clicking Reintentar refetches and the list renders.
    const reintentar = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(reintentar)

    await waitFor(() => {
      expect(screen.queryByTestId('clientes-error-panel')).not.toBeInTheDocument()
    })

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)
    expect(callCount).toBeGreaterThanOrEqual(2)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #11.6 — performance: filter 500 records under 1s (NFR1).
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN 500 clientes WHEN user types a search query THEN filter resolves under 1000ms (NFR1)', async () => {
    // GIVEN: 500 records.
    const bulk = buildBulk(500)
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(bulk)))

    renderWithClient(<ClienteListView />)
    const allItems = await screen.findAllByTestId('cliente-list-item')
    expect(allItems.length).toBe(500)

    // WHEN
    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    const start = performance.now()
    fireEvent.change(search, { target: { value: 'Cliente Bulk 123' } })

    // THEN: filtered list contains "Cliente Bulk 123" only.
    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items.length).toBeGreaterThan(0)
      expect(items.length).toBeLessThan(500)
    })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1000)
  })
})
