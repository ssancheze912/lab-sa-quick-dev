/**
 * Story 2.1: Client List & Search — Automation Expansion (testarch-automate)
 * Epic 2: Client Management
 *
 * Edge cases NOT covered by the ATDD RED-phase suite (`ClienteListView.test.tsx`).
 * Kept in a dedicated file per `test-quality.md`'s file-length guidance and to keep the
 * primary behavioral spec focused on the story's literal Acceptance Criteria.
 *
 * Covers:
 *  - Whitespace-only search input (trim behavior, AC2 boundary)
 *  - No-match search state (distinct from the AC3 "no-clients" EmptyState variant)
 *  - Clearing the search term restores the full list
 *  - Multi-match filtering (more than one result)
 *  - Reverse-case search (lowercase term against an uppercase-leaning Nombre)
 *  - Loading state renders neither list items, EmptyState, nor ErrorPanel
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/test/msw/server'
import { createCliente, createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

const CLIENTES_ENDPOINT = '*/api/v1/clientes'

// Story 2.2: `ClientListItem` (rendered by `ClienteListView`) now wraps each row in a
// TanStack Router `Link` — a router context is required for it to resolve without crashing.
function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const rootRoute = createRootRoute({
    component: () => <ClienteListView />,
  })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => <div>Detail</div>,
  })
  const routeTree = rootRoute.addChildren([detailRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AC2 edge cases — search boundary behavior', () => {
  test('[P2] a whitespace-only search term does not filter the list (trimmed to empty)', async () => {
    // GIVEN: the client list has loaded with two distinct clients
    const acme = createCliente({ nombre: 'Acme Corp' })
    const beta = createCliente({ nombre: 'Beta SAS' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([acme, beta])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))

    // WHEN: the user types only whitespace into the search field
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: '   ' } })

    // THEN: both clients remain visible (whitespace-only term behaves as empty)
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2)
    })
  })

  test('[P2] a search term with leading/trailing whitespace still matches by trimmed substring', async () => {
    // GIVEN: the client list has loaded with a uniquely named client
    const acme = createCliente({ nombre: 'Acme Corp' })
    const beta = createCliente({ nombre: 'Beta SAS' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([acme, beta])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))

    // WHEN: the user types the search term padded with leading/trailing spaces
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: '  acme  ' } })

    // THEN: the matching client is still found (trimmed before matching)
    await waitFor(() => {
      const items = within(panel).getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(within(panel).getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  test('[P2] a search term matching no client renders zero list items and no EmptyState/ErrorPanel', async () => {
    // GIVEN: the client list has loaded with clients that will not match the search term
    const clientes = createClientes(2)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes)))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))

    // WHEN: the user searches for a term that matches nothing
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'zzz-no-such-client-zzz' } })

    // THEN: no list items render, and the "no-clients" EmptyState (AC3) does NOT appear,
    // since that variant is reserved for an empty search term with an empty dataset
    await waitFor(() => {
      expect(within(panel).queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  test('[P2] clearing the search term after filtering restores the full list', async () => {
    // GIVEN: the client list has loaded and the user has filtered it down to one result
    const acme = createCliente({ nombre: 'Acme Corp' })
    const beta = createCliente({ nombre: 'Beta SAS' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([acme, beta])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'acme' } })
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(1))

    // WHEN: the user clears the search field
    fireEvent.change(searchInput, { target: { value: '' } })

    // THEN: the full, unfiltered list is restored
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2)
    })
  })

  test('[P2] filters to all matching clients when more than one client matches the term', async () => {
    // GIVEN: three clients, two of which share a common substring in their Nombre
    const acmeOne = createCliente({ nombre: 'Acme Corp Norte' })
    const acmeTwo = createCliente({ nombre: 'Acme Corp Sur' })
    const beta = createCliente({ nombre: 'Beta SAS' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([acmeOne, acmeTwo, beta])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: the user searches for the shared substring
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'Acme' } })

    // THEN: both matching clients remain visible, the non-matching one is filtered out
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2)
    })
    expect(within(panel).queryByText('Beta SAS')).not.toBeInTheDocument()
  })

  test('[P3] matches a lowercase search term against a Nombre containing uppercase letters', async () => {
    // GIVEN: a client whose Nombre uses mixed/uppercase casing
    const cliente = createCliente({ nombre: 'GRUPO EMPRESARIAL XYZ' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([cliente])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(1))

    // WHEN: the user types an all-lowercase substring
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'empresarial' } })

    // THEN: the client still matches (case-insensitive on both sides)
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
  })
})

describe('Loading state — before the initial GET /api/v1/clientes resolves', () => {
  test('[P2] renders no list items, no EmptyState, and no ErrorPanel while the query is pending', async () => {
    // GIVEN: the backend response is deliberately delayed
    server.use(
      http.get(CLIENTES_ENDPOINT, async () => {
        await delay('infinite')
        return HttpResponse.json([])
      }),
    )

    // WHEN: ClienteListView mounts and the query has not yet resolved
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')

    // THEN: none of the three terminal states have rendered yet
    expect(within(panel).queryAllByTestId('cliente-list-item')).toHaveLength(0)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })
})
