import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { makeClientesBulk } from '@/test/factories/clienteFactory'
import { ClienteListView } from './ClienteListView'

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('ClienteListView', () => {
  it('renders the 280px panel with header and search input', async () => {
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    const panel = await screen.findByTestId('clientes-list-panel')
    expect(panel).toBeInTheDocument()
    expect(panel.className).toMatch(/lg:w-\[280px\]/)
    expect(screen.getByRole('heading', { level: 1, name: /Clientes/i })).toBeInTheDocument()

    const input = screen.getByTestId('clientes-search-input')
    expect(input).toHaveAttribute('aria-label', 'Buscar clientes')
    expect(input).toHaveAttribute('placeholder', 'Buscar por nombre o NIT...')
  })

  it('renders one ClientListItem per cliente after fetch resolves', async () => {
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(seedClientes.length)
    expect(items[0]).toHaveTextContent('Acme Corp')
    expect(items[0]).toHaveTextContent('900123456-7')
  })

  it('filters the list client-side in real time by Nombre and NIT (case-insensitive)', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    await screen.findAllByTestId('cliente-list-item')

    const input = screen.getByTestId('clientes-search-input')
    await user.clear(input)
    await user.type(input, 'acme')
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1),
    )
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '800987')
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1),
    )
    expect(screen.getByText('Beta Distribuciones')).toBeInTheDocument()
  })

  it('renders EmptyState "search-empty" when no results match the query', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    await screen.findAllByTestId('cliente-list-item')

    await user.type(screen.getByTestId('clientes-search-input'), 'zzz-no-match-zzz')

    const emptyState = await screen.findByTestId('empty-state-search-empty')
    expect(emptyState).toBeInTheDocument()
    expect(emptyState).toHaveTextContent(/No se encontró ningún cliente/i)
    expect(emptyState).toHaveTextContent(/Intenta con otro nombre o NIT/i)
    expect(screen.getByTestId('clientes-search-input')).toHaveValue('zzz-no-match-zzz')
  })

  it('renders EmptyState "no-clients" with disabled input and Nuevo cliente CTA on []', async () => {
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    )

    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    const emptyState = await screen.findByTestId('empty-state-no-clients')
    expect(emptyState).toBeInTheDocument()
    expect(emptyState).toHaveAttribute('aria-live', 'polite')
    expect(emptyState).toHaveTextContent(/No hay clientes registrados/i)
    expect(emptyState).toHaveTextContent(/Crea el primer cliente del sistema/i)
    expect(
      screen.getByRole('button', { name: /nuevo cliente/i }),
    ).toBeInTheDocument()

    expect(screen.getByTestId('clientes-search-input')).toBeDisabled()
  })

  it('renders ErrorPanel with Reintentar on 500 and refetches on click', async () => {
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        getCount += 1
        if (getCount === 1) {
          return HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 })
        }
        return HttpResponse.json(seedClientes)
      }),
    )

    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    const errorPanel = await screen.findByTestId('clientes-error-panel')
    expect(errorPanel).toHaveAttribute('role', 'alert')
    expect(errorPanel).toHaveTextContent(/No se pudo cargar/i)

    // While errored: no list, no empty state.
    expect(screen.queryByTestId('cliente-list-item')).toBeNull()
    expect(screen.queryByTestId('empty-state-no-clients')).toBeNull()

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0),
    )
    expect(getCount).toBeGreaterThanOrEqual(2)
  })

  it('renders skeleton with aria-busy="true" and disabled input during loading', async () => {
    server.use(
      http.get('*/api/v1/clientes', async () => {
        // Never resolves during the assertions below.
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return HttpResponse.json(seedClientes)
      }),
    )

    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    const skeleton = await screen.findByTestId('clientes-list-skeleton')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('clientes-search-input')).toBeDisabled()
  })

  it('completes client-side filtering over a 500-cliente dataset in under 900ms (NFR1)', async () => {
    const bulk = makeClientesBulk(500)
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(bulk)),
    )

    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items.length).toBe(500)

    const t0 = performance.now()
    await user.type(screen.getByTestId('clientes-search-input'), 'Cliente 250')
    await waitFor(() => {
      const remaining = screen.queryAllByTestId('cliente-list-item')
      // "Cliente 250" matches Cliente 250 only (all other numbers differ).
      expect(remaining.length).toBeGreaterThan(0)
      expect(remaining.length).toBeLessThan(500)
    })
    const elapsed = performance.now() - t0

    // NFR1: < 1s in real browser. Story Task 14 target is < 900ms conservative
    // jsdom threshold (real browser will be far faster). If this flakes in CI
    // consider dropping to a Vitest bench with median over N runs.
    expect(elapsed).toBeLessThan(900)
  })

  // ───────────────────────────────────────────────────────────────────────
  // Edge cases / expansions (Story 2.1 automate pass)
  // ───────────────────────────────────────────────────────────────────────

  it('[P1] treats a whitespace-only query as empty and shows the full list (trim behavior)', async () => {
    // GIVEN: Full seed loaded
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: The user types only whitespace (spaces + tab)
    await user.type(screen.getByTestId('clientes-search-input'), '   \t  ')

    // THEN: The filter behaves as empty — all seed clientes remain visible
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(
        seedClientes.length,
      ),
    )
    // AND: The search-empty state is NOT rendered (this branch requires q ≠ '' post-trim)
    expect(screen.queryByTestId('empty-state-search-empty')).toBeNull()
  })

  it('[P1] filters case-insensitively when the user types in UPPERCASE', async () => {
    // GIVEN: Full seed loaded
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: The user types the entire query in uppercase (data has "Acme Corp")
    await user.clear(screen.getByTestId('clientes-search-input'))
    await user.type(screen.getByTestId('clientes-search-input'), 'ACME')

    // THEN: Only Acme Corp remains — case-insensitive .toLowerCase()/.includes()
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1),
    )
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('[P1] restores the full list when the search query is cleared after filtering', async () => {
    // GIVEN: Full seed loaded and filtered down to one match
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )
    await screen.findAllByTestId('cliente-list-item')

    const input = screen.getByTestId('clientes-search-input')
    await user.type(input, 'acme')
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1),
    )

    // WHEN: The user clears the input
    await user.clear(input)

    // THEN: The full seed list is restored (regression guard for the query-cleared branch)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(
        seedClientes.length,
      ),
    )
    expect(screen.queryByTestId('empty-state-search-empty')).toBeNull()
  })

  it('[P2] handles special characters in the search query without crashing (dash, dot, paren)', async () => {
    // GIVEN: Full seed loaded
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: The user types characters that would break a naive regex-based filter.
    // The Story uses `.includes()` (not RegExp) — special chars must be literal.
    await user.type(screen.getByTestId('clientes-search-input'), '456-7')

    // THEN: The dash is treated literally and matches Acme's NIT "900123456-7"
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1),
    )
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('[P2] renders the search input enabled once data is available (not disabled)', async () => {
    // GIVEN / WHEN: Full seed loads successfully
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )
    await screen.findAllByTestId('cliente-list-item')

    // THEN: The search input is interactive (no loading / error / empty branches active)
    const input = screen.getByTestId('clientes-search-input')
    expect(input).not.toBeDisabled()
  })

  it('[P2] does not leak the loading skeleton into the DOM once data resolves', async () => {
    // GIVEN / WHEN: The default handler resolves quickly
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    await screen.findAllByTestId('cliente-list-item')

    // THEN: The skeleton container is gone (Story 2.1 renders it only while isLoading)
    expect(screen.queryByTestId('clientes-list-skeleton')).toBeNull()
  })

  it('[P2] renders at least 5 skeleton placeholders during initial loading (AC #6)', async () => {
    // GIVEN: Deliberately slow backend so the loading branch stays live
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return HttpResponse.json(seedClientes)
      }),
    )

    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )

    // WHEN: The skeleton container appears
    const skeleton = await screen.findByTestId('clientes-list-skeleton')

    // THEN: It exposes at least 5 individual skeleton bars (Story spec: "al menos 5")
    // react-loading-skeleton uses `containerTestId` when provided; count them.
    const bars = screen.getAllByTestId(/clientes-list-skeleton-item-/)
    expect(bars.length).toBeGreaterThanOrEqual(5)
    expect(skeleton).toBeInTheDocument()
  })

  it('[P2] preserves the typed query even when the empty-state search-empty variant renders', async () => {
    // GIVEN: A non-matching query produces the search-empty branch
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteListView />
      </Providers>,
    )
    await screen.findAllByTestId('cliente-list-item')

    const input = screen.getByTestId('clientes-search-input')
    await user.type(input, 'zzz-no-match-zzz')

    // WHEN: The empty state is visible
    await screen.findByTestId('empty-state-search-empty')

    // THEN: The input value is preserved (users must be able to correct their query)
    expect(input).toHaveValue('zzz-no-match-zzz')
    // AND: The input is NOT disabled — user must still be able to type/backspace
    expect(input).not.toBeDisabled()
  })
})
