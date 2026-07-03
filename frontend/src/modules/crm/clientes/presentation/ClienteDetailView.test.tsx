/**
 * Story 2.2 — Client Detail View — Component ATDD (RED phase)
 * Epic 2: Client Management
 *
 * These tests define the expected behavior of `<ClienteDetailView>` BEFORE the
 * implementation exists. They will fail until Task 7 (useCliente hook),
 * Task 8 (ClienteDetailView presentation), and Task 10 (ClienteNotFound
 * shared component) are complete.
 *
 * Test cases covered:
 *   TC-E2-P1-04 (deep-link happy-path — renders 4 fields for a known id)
 *   TC-E2-P1-05 (404 → ClienteNotFound with Volver-a-la-lista link)
 *   AC #1, #2, #3, #11 — happy-path fields, 404 handling, Spanish copy, skeleton
 *
 * ACs covered: #1 (URL sync / detail body), #2 (deep-link), #3 (not-found),
 * #11 (Spanish copy — Nombre / NIT-RUC / Teléfono / Ciudad).
 *
 * Given-When-Then structure. Network-first (MSW handlers configured before
 * mount). Selectors are data-testid only. Tests import the component under
 * test directly and pass `clienteId` as a prop (bypasses TanStack Router —
 * the route file is a thin wrapper covered by e2e tests).
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'
import {
  clientesHandlers,
  makeCliente,
  resetClienteFactoryCounter,
} from '@/test/handlers/clientes'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  cleanup()
  resetClienteFactoryCounter()
})

// ─────────────────────────────────────────────────────────────────────────────
// Test harness
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

/**
 * Renders `<ClienteDetailView>` inside both a fresh QueryClient AND a stub
 * memory-router (needed because <ClienteNotFound>'s "Volver a la lista"
 * <Link> requires a router context).
 */
function renderDetailView(ui: ReactNode) {
  const client = makeQueryClient()
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/detail',
    component: () => <>{ui}</>,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="stub-clientes-list">List</div>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute, clientesRoute]),
    history: createMemoryHistory({ initialEntries: ['/detail'] }),
  })
  const utils = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...utils, client }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-04 — Happy path: 4 fields rendered with correct values
// AC covered: #1, #11
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — TC-E2-P1-04: happy path renders all 4 fields', () => {
  it('should render the cliente Nombre in the detail-field-nombre testid', async () => {
    // GIVEN: MSW serves a known cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000100',
      nombre: 'ACME S.A.S.',
      nitRuc: '900-100-001',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view is mounted for that id
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The Nombre field displays "ACME S.A.S."
    const field = await screen.findByTestId('cliente-detail-field-nombre')
    expect(field.textContent ?? '').toMatch(/ACME S\.A\.S\./)
  })

  it('should render the cliente NIT/RUC in the detail-field-nit-ruc testid', async () => {
    // GIVEN: MSW serves a known cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000101',
      nitRuc: '900-200-002',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view is mounted for that id
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The NIT/RUC field displays "900-200-002"
    const field = await screen.findByTestId('cliente-detail-field-nit-ruc')
    expect(field.textContent ?? '').toMatch(/900-200-002/)
  })

  it('should render the cliente Teléfono in the detail-field-telefono testid', async () => {
    // GIVEN: MSW serves a known cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000102',
      telefono: '3009998877',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view is mounted for that id
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The Teléfono field displays "3009998877"
    const field = await screen.findByTestId('cliente-detail-field-telefono')
    expect(field.textContent ?? '').toMatch(/3009998877/)
  })

  it('should render the cliente Ciudad in the detail-field-ciudad testid', async () => {
    // GIVEN: MSW serves a known cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000103',
      ciudad: 'Medellín',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view is mounted for that id
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The Ciudad field displays "Medellín"
    const field = await screen.findByTestId('cliente-detail-field-ciudad')
    expect(field.textContent ?? '').toMatch(/Medellín/)
  })

  it('should render Spanish field labels: Nombre, NIT/RUC, Teléfono, Ciudad (AC #11)', async () => {
    // GIVEN: MSW serves any cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000104',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view is mounted
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The article container renders all four Spanish labels
    const article = await screen.findByTestId('cliente-detail')
    const text = article.textContent ?? ''
    expect(text).toMatch(/Nombre/)
    expect(text).toMatch(/NIT\/RUC/)
    expect(text).toMatch(/Teléfono/)
    expect(text).toMatch(/Ciudad/)
  })

  it('should NOT render the ClienteNotFound panel on a successful response', async () => {
    // GIVEN: MSW serves a known cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000105',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view resolves the query
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)
    await screen.findByTestId('cliente-detail-field-nombre')

    // THEN: The not-found panel is NOT rendered simultaneously
    expect(screen.queryByTestId('cliente-not-found')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05 — 404 → ClienteNotFound with Volver-a-la-lista CTA
// AC covered: #3, #11
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — TC-E2-P1-05: 404 renders ClienteNotFound with back link', () => {
  it('should render the cliente-not-found panel when the API returns 404', async () => {
    // GIVEN: MSW returns 404 for the requested id
    server.use(clientesHandlers.byIdNotFound())

    // WHEN: The detail view is mounted for a non-existent id
    renderDetailView(
      <ClienteDetailView clienteId="00000000-0000-0000-0000-000000000000" />,
    )

    // THEN: The <ClienteNotFound> panel is visible
    const panel = await screen.findByTestId('cliente-not-found')
    expect(panel).toBeInTheDocument()
  })

  it('should render Spanish copy inside the not-found panel', async () => {
    // GIVEN: MSW returns 404
    server.use(clientesHandlers.byIdNotFound())

    // WHEN: The detail view mounts
    renderDetailView(
      <ClienteDetailView clienteId="00000000-0000-0000-0000-000000000000" />,
    )

    // THEN: The panel copy matches the Spanish message from AC #3
    const panel = await screen.findByTestId('cliente-not-found')
    expect(panel.textContent ?? '').toMatch(/no se encontró el cliente/i)
  })

  it('should expose a "Volver a la lista" link pointing to /clientes', async () => {
    // GIVEN: MSW returns 404
    server.use(clientesHandlers.byIdNotFound())

    // WHEN: The detail view mounts
    renderDetailView(
      <ClienteDetailView clienteId="00000000-0000-0000-0000-000000000000" />,
    )

    // THEN: The back link is present, labelled in Spanish, and href points to
    //       /clientes so the user is never trapped on the not-found panel.
    const panel = await screen.findByTestId('cliente-not-found')
    const back = within(panel).getByTestId('cliente-not-found-back')
    expect(back.textContent ?? '').toMatch(/volver a la lista/i)
    expect(back.getAttribute('href')).toMatch(/\/clientes$/)
  })

  it('should NOT render the detail fields when the API returns 404', async () => {
    // GIVEN: MSW returns 404
    server.use(clientesHandlers.byIdNotFound())

    // WHEN: The detail view mounts
    renderDetailView(
      <ClienteDetailView clienteId="00000000-0000-0000-0000-000000000000" />,
    )
    await screen.findByTestId('cliente-not-found')

    // THEN: None of the four detail-field testids are present
    expect(screen.queryByTestId('cliente-detail-field-nombre')).toBeNull()
    expect(screen.queryByTestId('cliente-detail-field-nit-ruc')).toBeNull()
    expect(screen.queryByTestId('cliente-detail-field-telefono')).toBeNull()
    expect(screen.queryByTestId('cliente-detail-field-ciudad')).toBeNull()
  })

  it('should NOT render the ErrorPanel when the API returns 404 (404 != generic error)', async () => {
    // GIVEN: MSW returns 404
    server.use(clientesHandlers.byIdNotFound())

    // WHEN: The detail view mounts
    renderDetailView(
      <ClienteDetailView clienteId="00000000-0000-0000-0000-000000000000" />,
    )
    await screen.findByTestId('cliente-not-found')

    // THEN: The generic error panel is NOT rendered (branch discipline)
    expect(screen.queryByTestId('error-panel')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Non-404 error path — ErrorPanel is reused for 5xx / network errors
// AC covered: implicit — Story 2.1 ErrorPanel reuse
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — non-404 error path shows the shared ErrorPanel', () => {
  it('should render the ErrorPanel (not ClienteNotFound) when the API returns 500', async () => {
    // GIVEN: MSW returns 500 for the requested id
    server.use(clientesHandlers.byIdError(500))

    // WHEN: The detail view mounts
    renderDetailView(
      <ClienteDetailView clienteId="00000000-0000-4000-8000-000000000200" />,
    )

    // THEN: The shared ErrorPanel (from Story 2.1) is rendered
    const errorPanel = await screen.findByTestId('error-panel')
    expect(errorPanel).toBeInTheDocument()

    // AND: The not-found panel is NOT rendered — 500 is not a 404
    expect(screen.queryByTestId('cliente-not-found')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton — react-loading-skeleton visible while query is pending
// AC covered: implicit — Story 2.1 loading UX rule (never a spinner)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — Loading skeleton visible while fetching', () => {
  it('should render the detail-skeleton before the query resolves', async () => {
    // GIVEN: MSW delays the response so `isLoading` stays true briefly
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000300',
    })
    server.use(clientesHandlers.byIdDelayed(cliente, 300))

    // WHEN: The detail view mounts (query is pending)
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The skeleton placeholder is present in the initial render
    const skeleton = await screen.findByTestId('cliente-detail-skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('should dismiss the skeleton once the query resolves with data', async () => {
    // GIVEN: MSW returns a short delayed response
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000301',
      nombre: 'Cliente Resolved',
    })
    server.use(clientesHandlers.byIdDelayed(cliente, 50))

    // WHEN: The detail view mounts and the query eventually resolves
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: After resolution, the fields are rendered and the skeleton is gone
    await screen.findByTestId('cliente-detail-field-nombre')
    await waitFor(() =>
      expect(screen.queryByTestId('cliente-detail-skeleton')).toBeNull(),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Deep-link selection sync — AC #2 (proxied through <ClienteDetailView>)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — outer article carries data-testid="cliente-detail"', () => {
  it('should mount the cliente-detail wrapper on successful load', async () => {
    // GIVEN: MSW serves a cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000400',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view mounts
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The outer <article data-testid="cliente-detail"> is present
    const article = await screen.findByTestId('cliente-detail')
    expect(article).toBeInTheDocument()
  })
})
