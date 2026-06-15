/**
 * Story 2.2: Client Detail View
 * Epic 2: Gestión de Clientes
 *
 * Component tests for `ClienteDetailView`. Covers AC #10 — six sub-cases.
 */

import { describe, expect, test, beforeAll, afterEach, afterAll, vi } from 'vitest'

vi.mock('siesa-ui-kit', () => ({
  ToastProvider: ({ children }: { children?: React.ReactNode }) => children,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import type { ReactElement } from 'react'
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENTE_ID = '00000000-0000-0000-0000-000000000001'

const FULL_CLIENTE = {
  id: CLIENTE_ID,
  nombre: 'Acme Industrial S.A.S.',
  nit: '900111222-1',
  telefono: '3001112233',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const CLIENTE_WITH_NULLS = {
  ...FULL_CLIENTE,
  telefono: null,
  ciudad: null,
}

const server = setupServer(
  http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => HttpResponse.json(FULL_CLIENTE)),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — wrap the component in QueryClient + RouterProvider so `useRouter`
// resolves and `router.navigate({ to: '/clientes' })` finds a matching route.
// ─────────────────────────────────────────────────────────────────────────────

function renderWithRouterAndClient(ui: ReactElement, initialPath = `/clientes/${CLIENTE_ID}`) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const clientesIndex = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-index-marker">Lista</div>,
  })

  const clientesDetail = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => ui,
  })

  const routeTree = rootRoute.addChildren([clientesIndex, clientesDetail])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AC #10.1 — renders four fields from a full cliente
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — Story 2.2', () => {
  test('renders four fields from cliente (Nombre, NIT/RUC, Teléfono, Ciudad)', async () => {
    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)

    // Wait for the loaded state — `cliente-detail-nombre` only renders once
    // the query resolves (the loading state shows skeletons under the same
    // panel testid).
    expect(await screen.findByTestId('cliente-detail-nombre')).toHaveTextContent(
      'Acme Industrial S.A.S.',
    )

    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()

    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900111222-1')
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('3001112233')
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #10.2 — em-dash for null telefono / ciudad (AC #6)
  // ───────────────────────────────────────────────────────────────────────────
  test('renders em-dash for null telefono and ciudad', async () => {
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => HttpResponse.json(CLIENTE_WITH_NULLS)),
    )

    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)

    // Wait for the loaded state.
    await screen.findByTestId('cliente-detail-nombre')

    // The two value cells show the literal em-dash, NOT "null", NOT empty.
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('—')
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('—')

    // Labels stay visible.
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()

    // Never render the JS literal "null" string.
    const panel = screen.getByTestId('cliente-detail-panel')
    expect(panel.textContent).not.toMatch(/\bnull\b/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #10.3 — loading skeleton state (AC #5)
  // ───────────────────────────────────────────────────────────────────────────
  test('renders loading skeleton while the query is in flight', async () => {
    // Hold the request open so the query stays in `isLoading` for a moment.
    let release: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })

    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, async () => {
        await pending
        return HttpResponse.json(FULL_CLIENTE)
      }),
    )

    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)

    // While the query is loading, the panel is mounted but no values render.
    const panel = await screen.findByTestId('cliente-detail-panel')
    expect(panel).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()

    // react-loading-skeleton renders elements with class `react-loading-skeleton`.
    const skeletons = panel.querySelectorAll('.react-loading-skeleton')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)

    release()
    await waitFor(() =>
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument(),
    )
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #10.4 — not-found view on 404 (AC #3)
  // ───────────────────────────────────────────────────────────────────────────
  test('renders not-found panel when the API returns 404', async () => {
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
        new HttpResponse(
          JSON.stringify({
            status: 404,
            title: 'Cliente no encontrado.',
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
          }),
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)

    const notFound = await screen.findByTestId('cliente-not-found')
    expect(notFound).toBeInTheDocument()
    expect(notFound).toHaveTextContent(/cliente no encontrado/i)
    expect(notFound).toHaveTextContent(/el cliente solicitado no existe o fue eliminado/i)

    const volver = screen.getByRole('button', { name: /volver a la lista/i })
    expect(volver).toBeInTheDocument()

    // NO error panel rendered.
    expect(screen.queryByTestId('cliente-detail-error')).not.toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC #10.5 — 5xx → ErrorPanel; Reintentar recovers on 200 (AC #4)
  // ───────────────────────────────────────────────────────────────────────────
  test('renders error panel for 5xx and recovers on retry', async () => {
    let callCount = 0
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        callCount += 1
        if (callCount === 1) {
          return new HttpResponse(JSON.stringify({ status: 500, title: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/problem+json' },
          })
        }
        return HttpResponse.json(FULL_CLIENTE)
      }),
    )

    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)

    const errorPanel = await screen.findByTestId('cliente-detail-error')
    expect(errorPanel).toBeInTheDocument()
    expect(errorPanel).toHaveTextContent(/no se pudo cargar el cliente/i)
    expect(errorPanel).toHaveTextContent(/intenta de nuevo en unos segundos/i)

    const reintentar = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(reintentar)

    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-error')).not.toBeInTheDocument()
    })

    const nombre = await screen.findByTestId('cliente-detail-nombre')
    expect(nombre).toHaveTextContent('Acme Industrial S.A.S.')
    expect(callCount).toBeGreaterThanOrEqual(2)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Story 2.4 — btn-editar-cliente assertions.
  // ───────────────────────────────────────────────────────────────────────────

  test('ClienteDetailView_renders_btn_editar_cliente', async () => {
    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)

    expect(await screen.findByTestId('cliente-detail-nombre')).toBeInTheDocument()
    const btn = screen.getByTestId('btn-editar-cliente')
    expect(btn).toBeVisible()
    expect(btn).toHaveAttribute('aria-label', 'Editar cliente')
  })

  test('ClienteDetailView_opens_edit_dialog_on_btn_click', async () => {
    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)

    await screen.findByTestId('cliente-detail-nombre')
    fireEvent.click(screen.getByTestId('btn-editar-cliente'))

    expect(await screen.findByTestId('cliente-form-dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /editar cliente/i }),
    ).toBeInTheDocument()

    // Pre-filled with the cliente's nombre.
    expect((screen.getByLabelText(/^nombre \*$/i) as HTMLInputElement).value).toBe(
      'Acme Industrial S.A.S.',
    )
  })

  test('ClienteDetailView_does_not_render_btn_editar_when_loading_or_error_or_not_found', async () => {
    // Sub-case 1: loading — keep the request open.
    let release: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, async () => {
        await pending
        return HttpResponse.json(FULL_CLIENTE)
      }),
    )

    const r1 = renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)
    await screen.findByTestId('cliente-detail-panel')
    expect(screen.queryByTestId('btn-editar-cliente')).not.toBeInTheDocument()
    release()
    r1.unmount()
    cleanup()

    // Sub-case 2: 5xx error.
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
        new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    )
    const r2 = renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)
    await screen.findByTestId('cliente-detail-error')
    expect(screen.queryByTestId('btn-editar-cliente')).not.toBeInTheDocument()
    r2.unmount()
    cleanup()

    // Sub-case 3: not-found (404 → data === null).
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
        new HttpResponse(
          JSON.stringify({ status: 404, title: 'Cliente no encontrado.' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    )
    renderWithRouterAndClient(<ClienteDetailView clienteId={CLIENTE_ID} />)
    await screen.findByTestId('cliente-not-found')
    expect(screen.queryByTestId('btn-editar-cliente')).not.toBeInTheDocument()
  })
})
