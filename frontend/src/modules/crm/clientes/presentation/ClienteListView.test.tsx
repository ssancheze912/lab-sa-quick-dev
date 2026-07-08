/**
 * Story 2.1 — ATDD (RED phase).
 *
 * The integration test for the split-panel list view. Covers AC #1–#7 by
 * mounting `ClienteListView` inside the real TanStack Router routeTree, with
 * MSW stubbing the `/api/v1/clientes` endpoint. Selection navigation is
 * verified against the router's location, not against a spy — this makes the
 * test resilient to internal wiring choices (useNavigate vs useRouter).
 *
 * RED until every implementation file listed under Story 2.1 tasks is created.
 */
import { describe, it, expect } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createTestQueryClient } from '@/test/render'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente, buildClientes } from '@/test/factories/cliente.factory'
import { routeTree } from '@/routeTree.gen'

function mountApp(initialPath = '/clientes') {
  const client = createTestQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('ClienteListView — happy path (AC #1)', () => {
  it('GIVEN backend returns 3 clientes, WHEN the view mounts, THEN 3 list items render', async () => {
    const fixture = [
      buildCliente({ nombre: 'Empresa A', nit: '900000001' }),
      buildCliente({ nombre: 'Empresa B', nit: '900000002' }),
      buildCliente({ nombre: 'Empresa C', nit: '900000003' }),
    ]
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )

    mountApp()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ver cliente:\s*empresa a/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /ver cliente:\s*empresa b/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver cliente:\s*empresa c/i })).toBeInTheDocument()
  })

  it('renders the left panel with role="complementary" and the exact 280px width class + flex-shrink-0', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
    )
    mountApp()

    const aside = await screen.findByRole('complementary', { name: /lista de clientes/i })
    expect(aside.className).toMatch(/w-\[280px\]/)
    expect(aside.className).toMatch(/flex-shrink-0/)
  })
})

describe('ClienteListView — search (AC #2)', () => {
  it('GIVEN 2 clientes, WHEN typing text matching one nombre, THEN only the matching item is visible', async () => {
    const fixture = [
      buildCliente({ nombre: 'Acosta SAS', nit: '111111111' }),
      buildCliente({ nombre: 'Bermudez LTDA', nit: '222222222' }),
    ]
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )
    mountApp()

    const input = await screen.findByLabelText(/buscar clientes/i)
    fireEvent.change(input, { target: { value: 'aco' } })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /ver cliente:\s*bermudez/i })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /ver cliente:\s*acosta/i })).toBeInTheDocument()
  })

  it('GIVEN 2 clientes, WHEN typing digits matching one NIT, THEN only the matching item is visible', async () => {
    const fixture = [
      buildCliente({ nombre: 'Empresa X', nit: '900555555' }),
      buildCliente({ nombre: 'Empresa Y', nit: '900999999' }),
    ]
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )
    mountApp()

    const input = await screen.findByLabelText(/buscar clientes/i)
    fireEvent.change(input, { target: { value: '555' } })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /ver cliente:\s*empresa y/i })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /ver cliente:\s*empresa x/i })).toBeInTheDocument()
  })

  it('GIVEN a cliente with accented characters, WHEN searching with plain letters, THEN it still matches (accent-insensitive)', async () => {
    const fixture = [
      buildCliente({ nombre: 'Peña Industrial', nit: '333333333' }),
    ]
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )
    mountApp()

    const input = await screen.findByLabelText(/buscar clientes/i)
    fireEvent.change(input, { target: { value: 'pen' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ver cliente:\s*peña/i })).toBeInTheDocument()
    })
  })

  it('GIVEN 3 clientes, WHEN typing rapid keystrokes, THEN exactly ONE MSW call happens across all keystrokes', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        calls += 1
        return HttpResponse.json(buildClientes(3), { status: 200 })
      }),
    )
    mountApp()

    const input = await screen.findByLabelText(/buscar clientes/i)
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ac' } })
    fireEvent.change(input, { target: { value: 'aco' } })
    fireEvent.change(input, { target: { value: 'acos' } })
    fireEvent.change(input, { target: { value: 'acost' } })

    // Give the debounce a chance to settle without producing extra fetches.
    await new Promise((resolve) => setTimeout(resolve, 250))

    expect(calls).toBe(1)
  })

  it('renders the search input with the exact placeholder "Buscar por nombre o NIT..." and aria-label "Buscar clientes"', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
    )
    mountApp()

    const input = await screen.findByLabelText(/buscar clientes/i)
    expect(input).toHaveAttribute('placeholder', 'Buscar por nombre o NIT...')
  })
})

describe('ClienteListView — empty states (AC #3, #4)', () => {
  it('GIVEN backend returns [], WHEN the list loads, THEN the "no-clients" EmptyState is shown', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
    )
    mountApp()

    expect(await screen.findByText('No hay clientes registrados')).toBeInTheDocument()
    expect(screen.getByText('Crea el primer cliente del sistema')).toBeInTheDocument()
  })

  it('GIVEN backend returns 2 clientes and the search matches zero, THEN the "search-empty" EmptyState is shown', async () => {
    const fixture = [
      buildCliente({ nombre: 'Acosta SAS' }),
      buildCliente({ nombre: 'Bermudez LTDA' }),
    ]
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )
    mountApp()

    const input = await screen.findByLabelText(/buscar clientes/i)
    fireEvent.change(input, { target: { value: 'zzzz-nada-nada' } })

    await waitFor(() => {
      expect(screen.getByText('No se encontró ningún cliente')).toBeInTheDocument()
    })
    expect(screen.getByText('Intenta con otro nombre o NIT')).toBeInTheDocument()
  })
})

describe('ClienteListView — error state (AC #5)', () => {
  it('GIVEN backend returns 500, WHEN the list loads, THEN the ErrorPanel is shown with Spanish copy and a Reintentar button', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json({}, { status: 500 })),
    )
    mountApp()

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista de clientes')).toBeInTheDocument()
    })
    expect(screen.getByText('Comprueba tu conexión e intenta nuevamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('GIVEN the ErrorPanel is visible, WHEN Reintentar is clicked and the backend recovers, THEN the list is re-fetched', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        calls += 1
        if (calls === 1) return HttpResponse.json({}, { status: 500 })
        return HttpResponse.json([buildCliente({ nombre: 'Recovered' })], { status: 200 })
      }),
    )
    mountApp()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ver cliente:\s*recovered/i })).toBeInTheDocument()
    })
    expect(calls).toBeGreaterThanOrEqual(2)
  })
})

describe('ClienteListView — loading skeletons (AC #6)', () => {
  it('GIVEN the request is in flight, WHEN the list first mounts, THEN exactly 6 skeleton items are rendered', async () => {
    // Delay the response so we can observe the loading state.
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 250))
        return HttpResponse.json([], { status: 200 })
      }),
    )
    mountApp()

    const skeletons = await screen.findAllByTestId('cliente-skeleton')
    expect(skeletons).toHaveLength(6)
  })
})

describe('ClienteListView — selection (AC #7)', () => {
  it('GIVEN a click on a ClienteListItem, WHEN the click resolves, THEN the router pathname is /clientes/{id}', async () => {
    const target = buildCliente({ nombre: 'Empresa A', nit: '900000001' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([target], { status: 200 })),
    )
    const router = mountApp()

    const item = await screen.findByRole('button', { name: /ver cliente:\s*empresa a/i })
    fireEvent.click(item)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clientes/${target.id}`)
    })
  })

  it('GIVEN a deep link to /clientes/:id, WHEN the list renders, THEN the matching item carries data-selected="true"', async () => {
    const target = buildCliente({ nombre: 'Empresa A' })
    const other = buildCliente({ nombre: 'Empresa B' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([target, other], { status: 200 })),
    )
    mountApp(`/clientes/${target.id}`)

    const item = await screen.findByRole('button', { name: /ver cliente:\s*empresa a/i })
    expect(item).toHaveAttribute('data-selected', 'true')

    const otherItem = screen.getByRole('button', { name: /ver cliente:\s*empresa b/i })
    expect(otherItem).toHaveAttribute('data-selected', 'false')
  })
})

describe('ClienteListView — split-panel wrapper (AC #1)', () => {
  it('renders inside the split-panel data-testid="clientes-view" (preserves Story 1.2 contract)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
    )
    mountApp()

    const view = await screen.findByTestId('clientes-view')
    // The list panel (aside) is a descendant of the split-panel container.
    within(view).getByRole('complementary', { name: /lista de clientes/i })
  })
})
