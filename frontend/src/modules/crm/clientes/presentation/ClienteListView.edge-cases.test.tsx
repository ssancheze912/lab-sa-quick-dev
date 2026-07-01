/**
 * Component edge-case tests for ClienteListView — Story 2.1.
 *
 * Expands the ATDD suite (which asserts happy paths for each AC) with
 * state-transition edges and interaction-level guarantees pulled from
 * test-design-epic-2 §4.1–4.3:
 *
 *   [P1] Skeleton is replaced by list once query resolves (AC #6 lifecycle)
 *   [P1] Clearing an active search restores the full list (AC #2 round-trip)
 *   [P2] NIT-only search: query targeting NIT digits returns the right item
 *   [P1] onSelect callback is wired from the view down to the item click
 *   [P2] Search input value persists across re-renders (state isolation)
 *
 * Level: Component (Vitest + RTL + MSW).
 * Given-When-Then structure. data-testid selectors only.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'

import { ClienteListView } from './ClienteListView'
import {
  clientesSuccessHandler,
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
// Harness
// -----------------------------------------------------------------------------

function renderView(ui: ReactNode = <ClienteListView onSelect={() => {}} />) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

// -----------------------------------------------------------------------------
// AC #6 — Skeleton → list transition
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #6: skeleton is replaced by the list', () => {
  it('[P1] given the view mounts, when the API resolves, then the skeleton is removed and the list is rendered', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))

    // WHEN
    renderView()

    // THEN — list eventually rendered
    await screen.findByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111')

    // AND — skeleton no longer in DOM (state transition validated)
    expect(screen.queryByTestId('cliente-list-skeleton')).not.toBeInTheDocument()
  })
})

// -----------------------------------------------------------------------------
// AC #2 — Search round-trip: filter → clear restores list
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #2: clearing the search input restores the full list', () => {
  it('[P1] given the user has filtered the list, when the input is cleared, then all clientes reappear without a new fetch', async () => {
    // GIVEN
    const requestSpy = vi.fn()
    server.events.on('request:start', requestSpy)
    server.use(clientesSuccessHandler(seedClientes))
    renderView()
    await screen.findByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111')

    const search = screen.getByTestId('cliente-search-input')

    // WHEN — filter
    fireEvent.change(search, { target: { value: 'acme' } })
    await waitFor(() =>
      expect(
        screen.queryByTestId('cliente-list-item-22222222-2222-2222-2222-222222222222'),
      ).not.toBeInTheDocument(),
    )

    // AND — clear
    fireEvent.change(search, { target: { value: '' } })

    // THEN — all three items are back
    await waitFor(() => {
      for (const c of seedClientes) {
        expect(screen.getByTestId(`cliente-list-item-${c.id}`)).toBeInTheDocument()
      }
    })

    // AND — still only the initial fetch happened
    const clientesRequests = requestSpy.mock.calls.filter(([{ request }]) =>
      request.url.includes('/api/v1/clientes'),
    )
    expect(clientesRequests).toHaveLength(1)
    server.events.removeListener('request:start', requestSpy)
  })
})

// -----------------------------------------------------------------------------
// AC #2 — NIT-only search
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #2: search matches NIT substrings', () => {
  it('[P2] given the list is loaded, when the query matches only a NIT substring (no nombre match), then only that item remains', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))
    renderView()
    await screen.findByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111')

    const search = screen.getByTestId('cliente-search-input')

    // WHEN — NIT of "Peña & Asociados" is 800987654; substring "800987" only appears in nit
    fireEvent.change(search, { target: { value: '800987' } })

    // THEN
    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-22222222-2222-2222-2222-222222222222'),
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('cliente-list-item-33333333-3333-3333-3333-333333333333'),
      ).not.toBeInTheDocument()
    })
  })
})

// -----------------------------------------------------------------------------
// AC #1 — Click on list item invokes onSelect prop from parent
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #1: click on list item is wired to onSelect prop', () => {
  it('[P1] given the parent passes onSelect, when the user clicks an item, then onSelect is invoked with the correct cliente id', async () => {
    // GIVEN
    const onSelect = vi.fn()
    server.use(clientesSuccessHandler(seedClientes))
    renderView(<ClienteListView onSelect={onSelect} />)
    const item = await screen.findByTestId(
      'cliente-list-item-33333333-3333-3333-3333-333333333333',
    )

    // WHEN
    fireEvent.click(item)

    // THEN
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('33333333-3333-3333-3333-333333333333')
  })

  it('[P1] given a selectedId prop, when the view renders, then the matching item receives selected styling and others do not', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))
    const targetId = '22222222-2222-2222-2222-222222222222'

    // WHEN
    renderView(<ClienteListView selectedId={targetId} onSelect={() => {}} />)
    const selected = await screen.findByTestId(`cliente-list-item-${targetId}`)
    const other = await screen.findByTestId(
      'cliente-list-item-11111111-1111-1111-1111-111111111111',
    )

    // THEN — selected item shows blue border, non-selected does not
    expect(selected.className).toMatch(/border-blue-600/)
    expect(other.className).not.toMatch(/border-blue-600/)
  })
})

// -----------------------------------------------------------------------------
// AC #4 — Whitespace-only search does not trigger search-empty state
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #4: whitespace-only query does not collapse the list', () => {
  it('[P2] given the list is loaded, when the user types only spaces, then the full list stays visible (whitespace is trimmed)', async () => {
    // GIVEN
    server.use(clientesSuccessHandler(seedClientes))
    renderView()
    await screen.findByTestId('cliente-list-item-11111111-1111-1111-1111-111111111111')

    // WHEN
    fireEvent.change(screen.getByTestId('cliente-search-input'), {
      target: { value: '   ' },
    })

    // THEN — all three items remain visible; no search-empty state shown
    for (const c of seedClientes) {
      expect(screen.getByTestId(`cliente-list-item-${c.id}`)).toBeInTheDocument()
    }
    expect(screen.queryByTestId('cliente-search-empty')).not.toBeInTheDocument()
  })
})

// -----------------------------------------------------------------------------
// AC #3 — Empty state does NOT render list items
// -----------------------------------------------------------------------------

describe('ClienteListView — AC #3: no items are rendered when API returns []', () => {
  it('[P1] given the API returns [], when the view resolves, then no cliente-list-item-* nodes exist in the DOM', async () => {
    // GIVEN
    server.use(
      clientesSuccessHandler([]) // reuse handler with empty body
    )
    // WHEN
    const { container } = renderView()

    // THEN
    await screen.findByTestId('cliente-list-empty')
    const items = container.querySelectorAll('[data-testid^="cliente-list-item-"]')
    expect(items.length).toBe(0)
  })
})
