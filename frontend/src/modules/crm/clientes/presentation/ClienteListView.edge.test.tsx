/**
 * Story 2.1 — Client List & Search — Component EDGE CASES (Automate expansion)
 * Epic 2: Client Management
 *
 * Expands the ATDD suite (ClienteListView.test.tsx) with edge cases and
 * negative paths that were not covered by the RED→GREEN cycle:
 *
 *   • Accent-insensitive matching ("García" ↔ "garcia") — AC #2 mandate
 *   • Search by NIT/RUC substring — AC #2 mandate (only nombre was covered)
 *   • Case-insensitive substring match
 *   • Empty / whitespace-only query returns the FULL list
 *   • Non-matching query returns zero visible items (no crash)
 *   • Filter MUST NOT match `telefono` or `ciudad` (PRD FR3/FR4 guard)
 *   • Clearing the search input restores the full list
 *
 * Uses the same MSW + QueryClient harness as the ATDD tests to keep the
 * network-first pattern intact. Priority: P1 (high-value edge coverage).
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
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

import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
import {
  clientesHandlers,
  makeCliente,
  resetClienteFactoryCounter,
} from '@/test/handlers/clientes'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  cleanup()
  resetClienteFactoryCounter()
})

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderWithClient(ui: ReactNode) {
  const client = makeQueryClient()
  // Story 2.2: ClientListItem uses a TanStack Router <Link>, so a router
  // context is now mandatory even when unit-testing <ClienteListView>.
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <>{ui}</>,
  })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => <>{ui}</>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([clientesRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: ['/clientes'] }),
  })
  const utils = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...utils, client }
}

// ─────────────────────────────────────────────────────────────────────────────
// Accent-insensitive matching — AC #2: "García" ↔ "garcia"
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteListView — accent-insensitive matching', () => {
  const accented: Cliente[] = [
    makeCliente({ nombre: 'García Corp', nitRuc: '900111111-1' }),
    makeCliente({ nombre: 'Fábrica Álvarez', nitRuc: '900222222-2' }),
    makeCliente({ nombre: 'Zapatería México', nitRuc: '900333333-3' }),
    makeCliente({ nombre: 'Otro Cliente', nitRuc: '900444444-4' }),
  ]

  it('[P1] should match "garcia" (unaccented query) against "García Corp" (accented data)', async () => {
    // GIVEN: A list containing an accented client name
    server.use(clientesHandlers.list(accented))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(4),
    )

    // WHEN: The user types the unaccented form
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), 'garcia')

    // THEN: The accented "García Corp" item is visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0].textContent ?? '').toMatch(/García Corp/)
    })
  })

  it('[P1] should match "García" (accented query) against unaccented data', async () => {
    // GIVEN: Both accented and unaccented data
    const mixed: Cliente[] = [
      makeCliente({ nombre: 'Garcia Latam', nitRuc: '900555555-5' }),
      makeCliente({ nombre: 'García Corp', nitRuc: '900111111-1' }),
      makeCliente({ nombre: 'Distribuidora Norte', nitRuc: '900666666-6' }),
    ]
    server.use(clientesHandlers.list(mixed))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3),
    )

    // WHEN: The user types the accented form
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), 'García')

    // THEN: BOTH "García Corp" and "Garcia Latam" are visible (accent-insensitive)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(2)
      const texts = items.map((el) => el.textContent ?? '').join(' ')
      expect(texts).toMatch(/García Corp/)
      expect(texts).toMatch(/Garcia Latam/)
    })
  })

  it('[P1] should match "mexico" against "Zapatería México"', async () => {
    // GIVEN: Accented data
    server.use(clientesHandlers.list(accented))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(4),
    )

    // WHEN: The user searches without any accent
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), 'mexico')

    // THEN: The item survives the filter
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0].textContent ?? '').toMatch(/Zapatería México/)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NIT/RUC substring matching — AC #2 explicit field list
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteListView — NIT/RUC substring matching', () => {
  const fixture: Cliente[] = [
    makeCliente({ nombre: 'Cliente Alpha', nitRuc: '900123456-7' }),
    makeCliente({ nombre: 'Cliente Beta', nitRuc: '901987654-3' }),
    makeCliente({ nombre: 'Cliente Gamma', nitRuc: '900999888-1' }),
    makeCliente({ nombre: 'Cliente Delta', nitRuc: '800111222-9' }),
  ]

  it('[P1] should filter by exact NIT/RUC digits', async () => {
    // GIVEN: A list with distinct NITs
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(4),
    )

    // WHEN: The user searches by a NIT prefix that is unique to one client
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), '901987654')

    // THEN: Only "Cliente Beta" (nitRuc 901987654-3) remains visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0].textContent ?? '').toMatch(/Cliente Beta/)
    })
  })

  it('[P1] should filter by NIT/RUC substring shared across multiple clients', async () => {
    // GIVEN: The fixture — Alpha (900123456-7) and Gamma (900999888-1) share
    //        the "900" prefix; Beta starts with "901"; Delta starts with "800".
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(4),
    )

    // WHEN: The user searches for the shared "900" prefix
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), '900')

    // THEN: The 2 matching clients (Alpha + Gamma) remain visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(2)
      const texts = items.map((el) => el.textContent ?? '').join(' ')
      expect(texts).toMatch(/Cliente Alpha/)
      expect(texts).toMatch(/Cliente Gamma/)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Case-insensitive substring match — AC #2
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] ClienteListView — case-insensitive substring match', () => {
  it('[P2] should match "CORP" against "Corporación Andina"', async () => {
    // GIVEN: A client whose name contains "Corporación"
    const fixture: Cliente[] = [
      makeCliente({ nombre: 'Corporación Andina', nitRuc: '900000000-1' }),
      makeCliente({ nombre: 'Otro Nombre', nitRuc: '900000000-2' }),
    ]
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2),
    )

    // WHEN: The user types uppercase
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), 'CORP')

    // THEN: The lowercase-typed match wins
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0].textContent ?? '').toMatch(/Corporación Andina/)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Empty / whitespace / non-matching queries — boundary behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteListView — empty, whitespace, and non-matching queries', () => {
  const fixture: Cliente[] = [
    makeCliente({ nombre: 'Cliente Uno', nitRuc: '900123456-1' }),
    makeCliente({ nombre: 'Cliente Dos', nitRuc: '900123456-2' }),
    makeCliente({ nombre: 'Cliente Tres', nitRuc: '900123456-3' }),
  ]

  it('[P1] should show the FULL list when the search input is empty', async () => {
    // GIVEN: The list is loaded
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3),
    )

    // WHEN: (implicit — no typing happened)
    const items = screen.getAllByTestId('cliente-list-item')

    // THEN: All 3 items are visible
    expect(items).toHaveLength(3)
  })

  it('[P1] should show the FULL list when the query is whitespace-only', async () => {
    // GIVEN: The list is loaded
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3),
    )

    // WHEN: The user types only whitespace
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), '   ')

    // THEN: The full list is still visible (trimmed query is empty)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
  })

  it('[P1] should render zero list items when the query matches nothing', async () => {
    // GIVEN: The list is loaded
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3),
    )

    // WHEN: The user types a term with no matches
    const user = userEvent.setup({ delay: null })
    await user.type(
      screen.getByTestId('cliente-list-search'),
      'ZZZZ-no-match-XXXX',
    )

    // THEN: The list container is still mounted but has zero items
    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items).toHaveLength(0)
    })
    // The list container remains present — search misses do NOT trigger EmptyState
    // (EmptyState is reserved for API-returned empty arrays per AC #3).
    expect(screen.getByTestId('cliente-list')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).toBeNull()
  })

  it('[P1] should restore the full list after clearing the search input', async () => {
    // GIVEN: The list is loaded and filtered
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3),
    )
    const user = userEvent.setup({ delay: null })
    const search = screen.getByTestId('cliente-list-search')
    await user.type(search, 'Uno')
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1),
    )

    // WHEN: The user clears the input
    await user.clear(search)

    // THEN: The full list is restored
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Field guard — filter MUST NOT match `telefono` or `ciudad` (PRD FR3/FR4)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteListView — field guard: telefono / ciudad NOT matched', () => {
  it('[P1] should NOT match against `ciudad` when the query only appears in that field', async () => {
    // GIVEN: One client whose nombre/nitRuc do NOT contain "medellin"
    //        but whose ciudad does
    const fixture: Cliente[] = [
      makeCliente({
        nombre: 'Distribuidora Sur',
        nitRuc: '900010101-1',
        ciudad: 'Medellín',
      }),
      makeCliente({
        nombre: 'Comercial Norte',
        nitRuc: '900010102-2',
        ciudad: 'Bogotá',
      }),
    ]
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2),
    )

    // WHEN: The user searches for the city name only
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), 'medellin')

    // THEN: No items match — ciudad is NOT a searchable field
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })

  it('[P1] should NOT match against `telefono` when the query only appears in that field', async () => {
    // GIVEN: One client whose nombre/nitRuc do NOT contain "555" but whose telefono does
    const fixture: Cliente[] = [
      makeCliente({
        nombre: 'Empresa A',
        nitRuc: '900010101-1',
        telefono: '3005551234',
      }),
      makeCliente({
        nombre: 'Empresa B',
        nitRuc: '900010102-2',
        telefono: '3009991234',
      }),
    ]
    server.use(clientesHandlers.list(fixture))
    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2),
    )

    // WHEN: The user searches for a phone digit sequence
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByTestId('cliente-list-search'), '555')

    // THEN: No items match — telefono is NOT a searchable field
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })
})
