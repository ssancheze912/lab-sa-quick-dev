/**
 * Component tests for ClienteListView — Story 2.1 AC #1, #2, #3, #4, #5, #6.
 *
 * Uses:
 * - MSW to mock GET /api/v1/clientes network calls (network-first).
 * - React Testing Library + TanStack Query in-memory provider.
 *
 * Given-When-Then structure. `data-testid` selectors only (no CSS).
 * Test IDs: 2.1-COMP-001..008 (priority tags inline on each `it`).
 */
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'

import { ClienteListView } from './ClienteListView'
import {
  clientesSuccessHandler,
  clientesEmptyHandler,
  clientesErrorHandler,
  seedClientes,
} from '../__mocks__/msw-handlers'

// -----------------------------------------------------------------------------
// MSW server lifecycle
// -----------------------------------------------------------------------------

const server = setupServer(clientesSuccessHandler())

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers(clientesSuccessHandler()))
afterAll(() => server.close())

// -----------------------------------------------------------------------------
// Test harness
// -----------------------------------------------------------------------------

function renderView(ui: ReactNode = <ClienteListView onSelect={() => {}} />) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

// -----------------------------------------------------------------------------
// AC #6 — Pending state renders skeleton
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #6: loading skeleton', () => {
  it('[P1][2.1-COMP-001] given the query is pending, when the view mounts, then it renders the skeleton wrapper', async () => {
    // GIVEN a slow response so the pending state is observable
    server.use(clientesSuccessHandler(seedClientes))

    // WHEN
    renderView()

    // THEN — skeleton is visible during initial pending
    expect(await screen.findByTestId('cliente-list-skeleton')).toBeInTheDocument()
  })
})

// -----------------------------------------------------------------------------
// AC #1 — Split layout: 280px list panel + list items with Nombre + NIT
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #1: 280px list panel + list items', () => {
  it('[P0][2.1-COMP-002] given 3 clientes are returned, when the view resolves, then the list panel is present and 280px wide', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))
    // WHEN
    renderView()
    // THEN
    const panel = await screen.findByTestId('cliente-list-panel')
    expect(panel).toBeInTheDocument()
    // Width may come from a class like w-[280px] — assert via className token
    // OR a live style attribute. Either evidences the 280px contract.
    const hasWidthClass = /w-\[280px\]/.test(panel.className)
    const inlineWidth =
      panel.getAttribute('style')?.includes('width: 280px') ?? false
    expect(hasWidthClass || inlineWidth).toBe(true)
  })

  it('[P0][2.1-COMP-003] given 3 clientes are returned, when the view resolves, then each item exposes data-testid="cliente-list-item-{id}" with Nombre + NIT', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))
    // WHEN
    renderView()
    // THEN
    for (const c of seedClientes) {
      const item = await screen.findByTestId(`cliente-list-item-${c.id}`)
      expect(item).toBeInTheDocument()
      expect(within(item).getByText(c.nombre)).toBeInTheDocument()
      expect(within(item).getByText(c.nit)).toBeInTheDocument()
    }
  })
})

// -----------------------------------------------------------------------------
// AC #2 — Real-time client-side search
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #2: real-time client-side search', () => {
  it('[P0][2.1-COMP-004] given the list is loaded, when the user types in the search input, then the visible list is filtered client-side and no extra fetch is issued', async () => {
    // GIVEN — spy on network fetches
    const requestSpy = vi.fn()
    server.events.on('request:start', requestSpy)
    server.use(clientesSuccessHandler(seedClientes))

    // WHEN — render + wait for list
    renderView()
    await screen.findByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111')

    const search = screen.getByTestId('cliente-search-input')
    // WHEN — type "acme" (case-insensitive, must only match Acme)
    fireEvent.change(search, { target: { value: 'acme' } })

    // THEN — Acme visible, others gone
    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId('cliente-list-item-22222222-2222-2222-2222-222222222222'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('cliente-list-item-33333333-3333-3333-3333-333333333333'),
      ).not.toBeInTheDocument()
    })

    // THEN — network fetch to /clientes only happened once (initial load)
    const clientesRequests = requestSpy.mock.calls.filter(([{ request }]) =>
      request.url.includes('/api/v1/clientes'),
    )
    expect(clientesRequests).toHaveLength(1)
    server.events.removeListener('request:start', requestSpy)
  })

  it('[P1][2.1-COMP-005] given the list is loaded, when the search input receives a value, then the search input has the expected placeholder and aria-label', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))
    // WHEN
    renderView()
    // THEN
    const search = await screen.findByTestId('cliente-search-input')
    expect(search).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC')
    expect(search).toHaveAttribute('aria-label', 'Buscar clientes')
  })
})

// -----------------------------------------------------------------------------
// AC #3 — EmptyState "no-clients" when API returns []
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #3: EmptyState no-clients variant', () => {
  it('[P1][2.1-COMP-006] given the API returns an empty array, when the view resolves, then it renders the no-clients EmptyState', async () => {
    // GIVEN
    server.use(clientesEmptyHandler())
    // WHEN
    renderView()
    // THEN
    const empty = await screen.findByTestId('cliente-list-empty')
    expect(empty).toBeInTheDocument()
    expect(within(empty).getByText('No hay clientes registrados')).toBeInTheDocument()
    expect(within(empty).getByText('Crea el primer cliente del sistema')).toBeInTheDocument()
    expect(empty).toHaveAttribute('aria-live', 'polite')
  })
})

// -----------------------------------------------------------------------------
// AC #4 — EmptyState "search-empty" when filter matches nothing
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #4: EmptyState search-empty variant', () => {
  it('[P1][2.1-COMP-007] given the list is loaded, when the search query matches no records, then it renders the search-empty EmptyState', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))
    // WHEN
    renderView()
    await screen.findByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111')

    fireEvent.change(screen.getByTestId('cliente-search-input'), {
      target: { value: 'zzzzzzz-nothing-matches' },
    })

    // THEN
    const empty = await screen.findByTestId('cliente-search-empty')
    expect(empty).toBeInTheDocument()
    expect(within(empty).getByText('No se encontró ningún cliente')).toBeInTheDocument()
    expect(within(empty).getByText('Intenta con otro nombre o NIT')).toBeInTheDocument()
    expect(empty).toHaveAttribute('aria-live', 'polite')
  })
})

// -----------------------------------------------------------------------------
// AC #5 — ErrorPanel + Reintentar
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #5: ErrorPanel + Reintentar', () => {
  it('[P0][2.1-COMP-008] given the API returns 500, when the query fails, then it renders the ErrorPanel with fixed Spanish copy', async () => {
    // GIVEN
    server.use(clientesErrorHandler())
    // WHEN
    renderView()
    // THEN
    const errorPanel = await screen.findByTestId('cliente-list-error')
    expect(errorPanel).toBeInTheDocument()
    expect(
      within(errorPanel).getByText('No pudimos cargar la lista de clientes.'),
    ).toBeInTheDocument()
    expect(within(errorPanel).getByTestId('cliente-list-retry')).toBeInTheDocument()
  })

  it('[P0][2.1-COMP-009] given the ErrorPanel is visible, when the user clicks Reintentar, then a new fetch is issued and the list eventually renders', async () => {
    // GIVEN — first request fails, then the handler is swapped to success
    server.use(clientesErrorHandler())
    renderView()
    const errorPanel = await screen.findByTestId('cliente-list-error')

    // WHEN — swap to success handler and click Reintentar
    server.use(clientesSuccessHandler(seedClientes))
    fireEvent.click(within(errorPanel).getByTestId('cliente-list-retry'))

    // THEN — list renders after retry
    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
      ).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-list-error')).not.toBeInTheDocument()
  })

  it('[P0][2.1-COMP-010] given the API returns 500, when the ErrorPanel renders, then no raw backend error text is visible (NFR6)', async () => {
    // GIVEN
    server.use(clientesErrorHandler())
    // WHEN
    renderView()
    const errorPanel = await screen.findByTestId('cliente-list-error')
    // THEN — must not leak error.message / stack traces / status codes
    expect(errorPanel.textContent ?? '').not.toMatch(
      /stack|trace|axios|network error|status.*500|Internal Server Error/i,
    )
  })
})
