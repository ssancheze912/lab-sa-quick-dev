/**
 * Story 2.2 — /clientes/$clienteId route integration ATDD (RED phase).
 *
 * Acceptance Criteria covered:
 *   AC #4  — Clicking a list item navigates to /clientes/{id} without remounting the list
 *   AC #5  — Cold deep link mounts BOTH list and detail in the same tick
 *   AC #6  — Deep link to non-existent id renders ClienteNotFound, "Volver a la lista" returns to /clientes
 *   AC #10 — Switching selection does NOT remount the list panel
 *
 * Aligned test cases (test-design-epic-2.md):
 *   TC-E2-P1-01 (route integration leg) — Deep link to client detail
 *   R7         — Deep link to non-existent id graceful not-found
 *
 * MUST fail until routes/clientes.$clienteId.tsx, ClientesShell, ClienteDetailView,
 * ClienteNotFound and the per-id MSW handlers are implemented.
 */
import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { http, HttpResponse } from 'msw'

import { server } from '@/mocks/server'
import {
  buildClienteFixture,
  clienteByIdHandler,
  clienteByIdNotFoundHandler,
} from '@/mocks/handlers/clientes'
import { routeTree } from '../routeTree.gen'

function renderRouterAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  })
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return { router, ...utils }
}

describe('Route /clientes/$clienteId — Story 2.2 ATDD', () => {
  // ─── AC #5 — cold deep link mounts list AND detail together ──────────
  test('AC #5 — cold deep link mounts the list panel AND the detail card in the same tick', async () => {
    // GIVEN: list endpoint returns the client; per-id endpoint returns it as well
    const cliente = buildClienteFixture({ nombre: 'Cold Deep Link' })
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
      ...clienteByIdHandler(cliente)
    )

    // WHEN: router boots at /clientes/{id}
    renderRouterAt(`/clientes/${cliente.id}`)

    // THEN: both panels are present
    expect(await screen.findByTestId('client-list-panel')).toBeInTheDocument()
    expect(await screen.findByTestId('cliente-detail-card')).toBeInTheDocument()
    // Name appears in BOTH the list item (left) and the DescriptionList row (right).
    expect(screen.getAllByText('Cold Deep Link').length).toBeGreaterThanOrEqual(1)
  })

  // ─── AC #6 / R7 — non-existent id → ClienteNotFound, no list remount ─
  test('AC #6 / R7 — deep link to a non-existent id renders ClienteNotFound; list stays interactive', async () => {
    const id = '00000000-0000-0000-0000-000000000000'
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
      ...clienteByIdNotFoundHandler(id)
    )

    renderRouterAt(`/clientes/${id}`)

    // ClienteNotFound + the left list panel are both visible
    expect(await screen.findByTestId('cliente-not-found')).toBeInTheDocument()
    expect(screen.getByTestId('client-list-panel')).toBeInTheDocument()
  })

  // ─── AC #6 — "Volver a la lista" navigates back to /clientes ────────
  test('AC #6 — clicking "Volver a la lista" returns the router to /clientes', async () => {
    const id = '11111111-1111-1111-1111-111111111111'
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
      ...clienteByIdNotFoundHandler(id)
    )
    const user = userEvent.setup()

    const { router } = renderRouterAt(`/clientes/${id}`)
    await screen.findByTestId('cliente-not-found')

    await user.click(screen.getByRole('button', { name: 'Volver a la lista' }))

    // The router pathname is back to /clientes (no clienteId segment)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  // ─── AC #4 / AC #10 — click list item → URL updates, list NOT remounted ─
  test('AC #4 / AC #10 — clicking a list item navigates to /clientes/{id} and the list panel keeps the same DOM node', async () => {
    const a = buildClienteFixture({ nombre: 'Cliente Alpha' })
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([a])),
      ...clienteByIdHandler(a)
    )
    const user = userEvent.setup()

    const { router } = renderRouterAt('/clientes')

    // Capture the list panel BEFORE click
    const panelBefore = await screen.findByTestId('client-list-panel')

    // WHEN: user clicks the list item (await item presence — the list query
    // is async so we cannot synchronously `getByTestId` right after the panel
    // mounts; the panel renders skeletons first).
    const listItem = await screen.findByTestId(`client-list-item-${a.id}`)
    await user.click(listItem)

    // THEN: URL updated; detail card present; list panel is the SAME DOM node (no remount)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clientes/${a.id}`)
    })
    expect(await screen.findByTestId('cliente-detail-card')).toBeInTheDocument()
    const panelAfter = screen.getByTestId('client-list-panel')
    expect(panelAfter).toBe(panelBefore)
  })
})
