/**
 * Story 2.2 — ClienteDetailView EDGE CASES (Automate expansion)
 * Epic 2: Client Management
 *
 * Expands the ATDD suite (`ClienteDetailView.test.tsx`) with edge cases that
 * the RED→GREEN cycle did not exercise:
 *
 *   • [P1] Unicode / accented content preserved verbatim (Spanish domain).
 *   • [P1] Long content (500+ chars in nombre) does not overflow / crash and
 *     stays inside the scrollable article.
 *   • [P1] Empty-string fields render as empty <dd> without throwing.
 *   • [P1] React's default text-node escaping prevents XSS: dangerous HTML
 *     in `nombre` is rendered as literal text, not injected as markup.
 *   • [P2] Skeleton container has NO cliente-detail testid (prevents ATDD
 *     `findByTestId('cliente-detail')` from resolving prematurely).
 *   • [P2] Changing the `clienteId` prop triggers a fresh query and swaps
 *     the rendered payload.
 *   • [P2] Non-404 error path exposes a retry-able ErrorPanel with the
 *     Reintentar button (Story 2.1 contract).
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
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
// [P1] Unicode / accented copy preserved verbatim (Spanish domain rule)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteDetailView — Unicode / accented content', () => {
  it('[P1] should render Spanish accents in the nombre exactly as received', async () => {
    // GIVEN: A cliente with accents + eñe + ampersand
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000001000',
      nombre: 'Comercializadora Peña — Ñandú & Compañía S.A.S.',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view renders
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: Every accented character survives verbatim (no HTML-escape drift)
    const nombre = await screen.findByTestId('cliente-detail-field-nombre')
    expect(nombre.textContent ?? '').toContain('Peña')
    expect(nombre.textContent ?? '').toContain('Ñandú')
    expect(nombre.textContent ?? '').toContain('Compañía')
    expect(nombre.textContent ?? '').toContain('&')
  })

  it('[P1] should render accented ciudad values verbatim (Medellín / Bogotá)', async () => {
    // GIVEN: A cliente whose ciudad uses accents
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000001001',
      ciudad: 'Bogotá',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view renders
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The ciudad <dd> contains the accented value verbatim
    const ciudad = await screen.findByTestId('cliente-detail-field-ciudad')
    expect(ciudad.textContent ?? '').toBe('Bogotá')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Long content — no overflow crash, still rendered inside <dd>
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteDetailView — Long content boundary', () => {
  it('[P1] should render a 500-character nombre without crashing', async () => {
    // GIVEN: A cliente with a very long nombre (well beyond DB-column expectations)
    const longNombre = 'X'.repeat(500)
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000002000',
      nombre: longNombre,
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view renders
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The nombre field displays the full string — no truncation
    //       (visual truncation is a CSS concern, not a React text concern).
    const nombre = await screen.findByTestId('cliente-detail-field-nombre')
    expect(nombre.textContent ?? '').toBe(longNombre)
  })

  it('[P1] should apply the overflow-y-auto class to the outer article', async () => {
    // GIVEN: Any successful load
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000002001',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view renders
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The article scroll class hook is present so long payloads
    //       (once more fields land in later stories) scroll internally
    //       instead of pushing the AppShell out of view.
    const article = await screen.findByTestId('cliente-detail')
    expect(article.className).toMatch(/overflow-y-auto/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Empty-string fields — no crash, empty <dd> rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteDetailView — empty-string fields', () => {
  it('[P1] should render an empty telefono field as an empty <dd>', async () => {
    // GIVEN: A cliente whose telefono is an empty string
    //        (backend contract allows string; empty is a legal degenerate value)
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000003000',
      telefono: '',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view renders
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The <dd data-testid="cliente-detail-field-telefono"> renders as
    //       an empty element (no "undefined" leak, no crash)
    const telefono = await screen.findByTestId('cliente-detail-field-telefono')
    expect(telefono.textContent).toBe('')
    // The "Teléfono" LABEL (<dt>) still exists so the layout is unbroken
    const article = telefono.closest('[data-testid="cliente-detail"]')
    expect(article?.textContent ?? '').toContain('Teléfono')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] XSS defence — React text-node escaping of dangerous HTML in nombre
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteDetailView — XSS defence via text-node escaping', () => {
  it('[P1] should render script/HTML in nombre as literal text (React escaping)', async () => {
    // GIVEN: A cliente whose nombre contains an HTML tag / script fragment.
    //        This mirrors a data-poisoning attempt at the backend that the
    //        frontend must render safely without executing.
    const dangerous = '<script>alert("xss")</script><b>Bold</b>'
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000004000',
      nombre: dangerous,
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The detail view renders
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The nombre <dd> contains the RAW string as text — NOT parsed HTML.
    //       React text-node insertion escapes < and > automatically.
    const nombre = await screen.findByTestId('cliente-detail-field-nombre')
    expect(nombre.textContent).toBe(dangerous)
    // No actual <script> or <b> element was created (queryByRole would find nothing)
    expect(nombre.querySelector('script')).toBeNull()
    expect(nombre.querySelector('b')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Skeleton container MUST NOT carry the cliente-detail testid
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] ClienteDetailView — skeleton vs detail testid discipline', () => {
  it('[P2] should NOT expose cliente-detail testid while loading (skeleton only)', async () => {
    // GIVEN: A slow-resolving byId handler so the skeleton stays mounted briefly
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000005000',
    })
    server.use(clientesHandlers.byIdDelayed(cliente, 300))

    // WHEN: The detail view mounts
    renderDetailView(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: The skeleton is present AND the detail article is NOT — this is
    //       load-bearing for the ATDD `findByTestId('cliente-detail')` "data
    //       loaded" signal. If both were mounted, the ATDD promise would
    //       resolve during the skeleton frame.
    await screen.findByTestId('cliente-detail-skeleton')
    expect(screen.queryByTestId('cliente-detail')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] clienteId prop change triggers a fresh query
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] ClienteDetailView — clienteId prop change', () => {
  it('[P2] should swap the rendered payload when clienteId changes', async () => {
    // GIVEN: MSW serves two distinct clientes
    const clienteA = makeCliente({
      id: '00000000-0000-4000-8000-000000006001',
      nombre: 'Cliente Uno',
    })
    const clienteB = makeCliente({
      id: '00000000-0000-4000-8000-000000006002',
      nombre: 'Cliente Dos',
    })
    server.use(clientesHandlers.byId(clienteA), clientesHandlers.byId(clienteB))

    // Local harness with the ability to rerender the same tree with a new prop
    const client = makeQueryClient()
    const rootRoute = createRootRoute({ component: () => <Outlet /> })
    const detailRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/detail',
      component: () => null,
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

    // WHEN: Rendered for id A first
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
        <ClienteDetailView clienteId={clienteA.id} />
      </QueryClientProvider>,
    )

    // THEN: The first payload lands
    let nombre = await screen.findByTestId('cliente-detail-field-nombre')
    expect(nombre.textContent).toBe('Cliente Uno')

    // WHEN: The same tree rerenders with id B
    rerender(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
        <ClienteDetailView clienteId={clienteB.id} />
      </QueryClientProvider>,
    )

    // THEN: The rendered payload swaps to B (queryKey change → fresh fetch)
    await waitFor(() => {
      const el = screen.getByTestId('cliente-detail-field-nombre')
      expect(el.textContent).toBe('Cliente Dos')
    })
    nombre = screen.getByTestId('cliente-detail-field-nombre')
    expect(nombre.textContent).toBe('Cliente Dos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Non-404 error — ErrorPanel exposes the Reintentar button (Story 2.1)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] ClienteDetailView — ErrorPanel retry button on non-404', () => {
  it('[P2] should expose the error-panel-retry button when the API returns 500', async () => {
    // GIVEN: MSW returns a hard 500
    server.use(clientesHandlers.byIdError(500))

    // WHEN: The detail view mounts
    renderDetailView(
      <ClienteDetailView clienteId="00000000-0000-4000-8000-000000007000" />,
    )

    // THEN: The shared ErrorPanel's retry button is present so the user can
    //       recover without a page reload (Story 2.1 UX contract reused).
    await screen.findByTestId('error-panel')
    expect(screen.getByTestId('error-panel-retry')).toBeInTheDocument()
  })
})
