/**
 * Story 2.1 — ClienteListView edge-case automation expansion.
 *
 * Complements ClienteListView.test.tsx with cases the ATDD layer omits:
 *   [P2] Mixed-case search fragments are case-insensitive (AC #4 explicit contract)
 *   [P2] Leading/trailing whitespace in the search input is treated as a substring search
 *   [P2] Clearing the search input restores the full list
 *   [P2] Empty list + non-empty search → no-clients EmptyState wins over search-empty
 *        (per branch order in the component)
 *   [P2] Sticky search input stays visible whether the body shows skeletons, error,
 *        empty state, or the list (regression guard for the aside layout)
 *   [P2] aside is the panel root and uses overflow-y-auto for scroll behaviour
 */
import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import type { ReactElement } from 'react'

import { server } from '@/mocks/server'
import {
  buildClienteFixture,
  clienteHandlers,
  clienteHandlersEmpty,
  clienteHandlersError,
} from '@/mocks/handlers/clientes'
import { ClienteListView } from './ClienteListView'

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ClienteListView — edge cases', () => {
  // ─── [P2] Mixed-case search is case-insensitive on Nombre ─────────────
  test('[P2] uppercase search fragment still matches a lowercase nombre', async () => {
    // GIVEN: a client whose nombre is lowercase
    server.use(...clienteHandlers([buildClienteFixture({ nombre: 'acme corporation' })]))
    const user = userEvent.setup()

    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByText('acme corporation')).toBeInTheDocument()

    // WHEN: user types in uppercase
    await user.type(screen.getByTestId('client-search-input'), 'ACME')

    // THEN: case-insensitive match — still visible
    await waitFor(() => {
      expect(screen.getByText('acme corporation')).toBeInTheDocument()
    })
  })

  // ─── [P2] Search trims leading whitespace and still matches ───────────
  test('[P2] search with leading/trailing whitespace still matches (component trims via toLowerCase().trim())', async () => {
    // GIVEN: 1 client + 1 client that should not match
    server.use(
      ...clienteHandlers([
        buildClienteFixture({ nombre: 'Distribuidora Match' }),
        buildClienteFixture({ nombre: 'Other Client' }),
      ]),
    )
    const user = userEvent.setup()

    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByText('Distribuidora Match')).toBeInTheDocument()

    // WHEN: user types fragment with whitespace
    await user.type(screen.getByTestId('client-search-input'), '   Match   ')

    // THEN: filter applies the trimmed value
    await waitFor(() => {
      expect(screen.getByText('Distribuidora Match')).toBeInTheDocument()
      expect(screen.queryByText('Other Client')).not.toBeInTheDocument()
    })
  })

  // ─── [P2] Clearing the search restores the full list ──────────────────
  test('[P2] clearing the search input restores the full list', async () => {
    // GIVEN: 2 clients with distinct names
    const a = buildClienteFixture({ nombre: 'Alpha One' })
    const b = buildClienteFixture({ nombre: 'Beta Two' })
    server.use(...clienteHandlers([a, b]))
    const user = userEvent.setup()

    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByText('Alpha One')).toBeInTheDocument()
    expect(screen.getByText('Beta Two')).toBeInTheDocument()

    // WHEN: user filters, then clears
    const input = screen.getByTestId('client-search-input')
    await user.type(input, 'Alpha')
    await waitFor(() => {
      expect(screen.queryByText('Beta Two')).not.toBeInTheDocument()
    })
    await user.clear(input)

    // THEN: both clients are visible again
    await waitFor(() => {
      expect(screen.getByText('Alpha One')).toBeInTheDocument()
      expect(screen.getByText('Beta Two')).toBeInTheDocument()
    })
  })

  // ─── [P2] no-clients short-circuits search-empty when data is [] ──────
  test('[P2] empty backend + non-empty search → no-clients EmptyState (not search-empty)', async () => {
    // GIVEN: backend returns []
    server.use(...clienteHandlersEmpty())
    const user = userEvent.setup()

    // WHEN: list mounts → user types something
    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByTestId('empty-state-no-clients')).toBeInTheDocument()

    await user.type(screen.getByTestId('client-search-input'), 'whatever')

    // THEN: still no-clients (data.length === 0 wins over filter-empty per branch order)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state-no-clients')).toBeInTheDocument()
      expect(screen.queryByTestId('empty-state-search-empty')).not.toBeInTheDocument()
    })
  })

  // ─── [P2] Sticky search input is visible while skeletons render ───────
  test('[P2] sticky search input remains visible during the pending state', async () => {
    // GIVEN: slow response so pending state is observable
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await delay(400)
        return HttpResponse.json([])
      }),
    )

    // WHEN
    renderWithQueryClient(<ClienteListView />)

    // THEN: input is part of the always-rendered chrome
    expect(screen.getByTestId('client-search-input')).toBeInTheDocument()
    expect(await screen.findByTestId('client-list-skeleton')).toBeInTheDocument()
  })

  // ─── [P2] Sticky search input is visible while error renders ──────────
  test('[P2] sticky search input remains visible while the ErrorPanel is showing', async () => {
    server.use(...clienteHandlersError())

    renderWithQueryClient(<ClienteListView />)

    expect(await screen.findByTestId('error-panel')).toBeInTheDocument()
    expect(screen.getByTestId('client-search-input')).toBeInTheDocument()
  })

  // ─── [P2] aside is the root + has overflow-y-auto ─────────────────────
  test('[P2] the panel root is an <aside> with overflow-y-auto for scrolling', async () => {
    server.use(...clienteHandlers([buildClienteFixture()]))

    renderWithQueryClient(<ClienteListView />)
    const panel = await screen.findByTestId('client-list-panel')

    expect(panel.tagName).toBe('ASIDE')
    expect(panel.className).toContain('overflow-y-auto')
    expect(panel.className).toContain('border-r')
  })

  // ─── [P2] role=listbox is set on the items container ──────────────────
  test('[P2] when items render, the container exposes role="listbox" with a Spanish aria-label', async () => {
    server.use(...clienteHandlers([buildClienteFixture()]))

    renderWithQueryClient(<ClienteListView />)
    const listbox = await screen.findByRole('listbox', { name: 'Lista de clientes' })
    expect(listbox).toBeInTheDocument()
  })

  // ─── [P2] Each item is wrapped in <li> for the listbox container ──────
  test('[P2] each client item is wrapped in a <li> within the listbox', async () => {
    const a = buildClienteFixture({ nombre: 'Cli A' })
    const b = buildClienteFixture({ nombre: 'Cli B' })
    server.use(...clienteHandlers([a, b]))

    renderWithQueryClient(<ClienteListView />)
    const listbox = await screen.findByRole('listbox', { name: 'Lista de clientes' })
    // Two <li> children, one per cliente
    const items = listbox.querySelectorAll('li')
    expect(items).toHaveLength(2)
  })

  // ─── [P2] Skeleton count is exactly 5 (regression guard for SKELETON_COUNT) ──
  test('[P2] exactly 5 skeleton items render during pending (no more, no less)', async () => {
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await delay(400)
        return HttpResponse.json([])
      }),
    )

    renderWithQueryClient(<ClienteListView />)
    await screen.findByTestId('client-list-skeleton')

    // SKELETON_COUNT is 5 by design — regression guard
    expect(screen.getAllByTestId('client-list-skeleton-item')).toHaveLength(5)
  })
})
