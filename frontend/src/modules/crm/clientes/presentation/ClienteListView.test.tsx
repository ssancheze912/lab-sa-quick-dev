/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until `ClienteListView` (and its supporting
 * `Cliente` domain type, `useClientes` hook, `EmptyState`/`ErrorPanel` components) are
 * implemented per Story 2.1 Tasks 3-5. Today the whole file fails to compile because none
 * of those modules exist yet — this is the expected RED state (missing implementation,
 * not a test bug), consistent with the project's established ATDD convention (see
 * `_bmad-output/atdd-checklist-1-3-backend-database-foundation.md`).
 *
 * Acceptance Criteria covered:
 *   AC1 — Client list renders in the left panel with Nombre + NIT/RUC per item
 *   AC2 — Real-time client-side search by Nombre/NIT, no extra network request per keystroke
 *   AC3 — EmptyState shown when there are no clients
 *   AC4 — ErrorPanel with "Reintentar" shown when the initial fetch fails; retry re-fetches;
 *         raw error/exception text is never rendered (NFR6)
 *
 * Required data-testid attributes (documented for DEV team, see ATDD checklist):
 *   - `clientes-list-panel` — the 280px left panel wrapper
 *   - `cliente-list-item`   — one per client row (Nombre + NIT/RUC visible)
 *   - `empty-state`         — rendered by the shared `EmptyState` component
 *   - `error-panel`         — rendered by the shared `ErrorPanel` component
 *
 * Required ARIA attributes:
 *   - search input: `aria-label="Buscar clientes"`, placeholder "Buscar cliente..."
 *   - search container: `role="search"`
 *   - `empty-state`: `aria-live="polite"`
 *
 * Network-first pattern (network-first.md): every test registers its MSW handler via
 * `server.use(...)` BEFORE rendering `ClienteListView`, since TanStack Query fires the
 * `GET /api/v1/clientes` request on mount.
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
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createCliente, createClientes } from '@/test/factories/cliente.factory'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { ClienteListView } from './ClienteListView'

// Wildcard origin match: robust regardless of how VITE_API_URL resolves in the test env
// (baseURL may be undefined under Vitest's default "test" mode, since only
// `.env.development` exists — see apiClient.ts). Matches the network-first pattern from
// `network-first.md` without coupling the test to a specific origin.
const CLIENTES_ENDPOINT = '*/api/v1/clientes'

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AC1 — client list renders with Nombre and NIT/RUC per item', () => {
  test('[P0] renders one cliente-list-item per client returned by GET /api/v1/clientes', async () => {
    // GIVEN: the backend returns two clients
    const clientes = createClientes(2)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes)))

    // WHEN: ClienteListView mounts and the query resolves
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')

    // THEN: exactly one list item renders per client
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2)
    })
  })

  test('[P0] displays the client Nombre inside its list item', async () => {
    // GIVEN: the backend returns a client named "Acme Corp"
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([cliente])))

    // WHEN: ClienteListView mounts and the query resolves
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')

    // THEN: the Nombre is visible within the list item
    await waitFor(() => {
      expect(within(panel).getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  test('[P0] displays the client NIT/RUC inside its list item', async () => {
    // GIVEN: the backend returns a client with NIT "900123456"
    const cliente = createCliente({ nit: '900123456' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([cliente])))

    // WHEN: ClienteListView mounts and the query resolves
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')

    // THEN: the NIT/RUC is visible within the list item
    await waitFor(() => {
      expect(within(panel).getByText('900123456')).toBeInTheDocument()
    })
  })
})

describe('AC2 — real-time client-side search by Nombre or NIT/RUC', () => {
  test('[P0] filters the list to clients whose Nombre matches the search term (case-insensitive)', async () => {
    // GIVEN: the client list has loaded with two distinct clients
    const acme = createCliente({ nombre: 'Acme Corp' })
    const beta = createCliente({ nombre: 'Beta SAS' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([acme, beta])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))

    // WHEN: the user types a lowercase substring of "Acme" in the search field
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'acme' } })

    // THEN: only the matching client remains visible
    await waitFor(() => {
      const items = within(panel).getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
    })
  })

  test('[P0] filters the list to clients whose NIT/RUC matches the search term', async () => {
    // GIVEN: the client list has loaded with two distinct clients
    const acme = createCliente({ nombre: 'Acme Corp', nit: '900111222' })
    const beta = createCliente({ nombre: 'Beta SAS', nit: '900333444' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([acme, beta])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))

    // WHEN: the user types Beta's NIT in the search field
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: '900333444' } })

    // THEN: only the matching client remains visible
    await waitFor(() => {
      const items = within(panel).getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
    })
  })

  test('[P1] does not fire an additional GET /api/v1/clientes request while the user types', async () => {
    // GIVEN: the client list has loaded and network calls are being counted
    let requestCount = 0
    const clientes = createClientes(2)
    server.use(
      http.get(CLIENTES_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json(clientes)
      }),
    )
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))
    expect(requestCount).toBe(1)

    // WHEN: the user types several characters into the search field
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: clientes[0].nombre } })
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(1))

    // THEN: no additional network request was triggered by typing (pure client-side filter)
    expect(requestCount).toBe(1)
  })
})

describe('AC3 — EmptyState displayed when there are no clients', () => {
  test('[P0] renders the empty-state when GET /api/v1/clientes resolves to an empty array', async () => {
    // GIVEN: the backend has no clients
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([])))

    // WHEN: ClienteListView mounts and the query resolves
    renderClienteListView()

    // THEN: the EmptyState is displayed instead of the list
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  test('[P1] the empty-state announces itself via aria-live="polite"', async () => {
    // GIVEN: the backend has no clients
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([])))

    // WHEN: ClienteListView mounts and the query resolves
    renderClienteListView()
    const emptyState = await screen.findByTestId('empty-state')

    // THEN: it is marked as a polite live region for assistive technology
    expect(emptyState).toHaveAttribute('aria-live', 'polite')
  })
})

describe('AC4 — ErrorPanel displayed when the initial fetch fails', () => {
  test('[P0] renders the error-panel with "No se pudo cargar" when GET /api/v1/clientes fails', async () => {
    // GIVEN: the backend is unavailable
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })))

    // WHEN: ClienteListView mounts and the query rejects
    renderClienteListView()

    // THEN: the ErrorPanel is displayed with the fixed, safe copy
    const errorPanel = await screen.findByTestId('error-panel')
    expect(within(errorPanel).getByText('No se pudo cargar')).toBeInTheDocument()
  })

  test('[P2] never renders the raw backend error/exception message (NFR6)', async () => {
    // GIVEN: the backend fails with a technical, exception-shaped payload
    const technicalMarker = 'NpgsqlException: connection refused at 10.0.0.5:5432'
    server.use(
      http.get(CLIENTES_ENDPOINT, () => HttpResponse.json({ detail: technicalMarker }, { status: 500 })),
    )

    // WHEN: ClienteListView mounts and the query rejects
    renderClienteListView()
    await screen.findByTestId('error-panel')

    // THEN: the raw technical error text is never rendered to the user
    expect(screen.queryByText(technicalMarker)).not.toBeInTheDocument()
  })

  test('[P1] clicking "Reintentar" re-triggers the GET /api/v1/clientes query', async () => {
    // GIVEN: the first request fails and a subsequent request would succeed
    let requestCount = 0
    const clientes = createClientes(1)
    server.use(
      http.get(CLIENTES_ENDPOINT, () => {
        requestCount += 1
        if (requestCount === 1) {
          return HttpResponse.json({ detail: 'boom' }, { status: 500 })
        }
        return HttpResponse.json(clientes)
      }),
    )
    renderClienteListView()
    const errorPanel = await screen.findByTestId('error-panel')

    // WHEN: the user clicks "Reintentar"
    fireEvent.click(within(errorPanel).getByRole('button', { name: /reintentar/i }))

    // THEN: a second request fires and the list eventually renders successfully
    await waitFor(() => expect(requestCount).toBe(2))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 2.2 (Task 6): `ClientListItem` becomes a `Link` to the deep-linkable
// `/clientes/$clienteId` route, wiring up the click navigation required by AC #1.
// No dedicated `ClientListItem.test.tsx` file exists yet, so these cases are added
// here per the story's own guidance. A minimal router harness (mirrors
// `AppNavigation.test.tsx`'s pattern) gives `Link` a real router context to resolve
// `to`/`params` against, without needing MSW (ClientListItem performs no network I/O).
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — links to the deep-linkable detail route (Story 2.2, AC #1)', () => {
  function renderClientListItemInRouter(cliente: Cliente) {
    const rootRoute = createRootRoute({
      component: () => <ClientListItem cliente={cliente} />,
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

    render(<RouterProvider router={router} />)
    return router
  }

  test('[P0] renders cliente-list-item as a link with an href pointing to /clientes/{clienteId}', async () => {
    // GIVEN a client to render
    const cliente = createCliente()

    // WHEN ClientListItem is rendered inside a router
    renderClientListItemInRouter(cliente)

    // THEN it renders as a link resolving to that client's detail route
    const link = await screen.findByTestId('cliente-list-item')
    expect(link).toHaveAttribute('href', `/clientes/${cliente.id}`)
  })

  test('[P1] clicking the item navigates the router to /clientes/{clienteId} (no full page reload)', async () => {
    // GIVEN a client rendered inside a router
    const cliente = createCliente()
    const router = renderClientListItemInRouter(cliente)
    const link = await screen.findByTestId('cliente-list-item')

    // WHEN the user clicks the item
    fireEvent.click(link)

    // THEN the router's location updates to the client's detail route (client-side navigation)
    await waitFor(() => expect(router.state.location.pathname).toBe(`/clientes/${cliente.id}`))
  })
})
