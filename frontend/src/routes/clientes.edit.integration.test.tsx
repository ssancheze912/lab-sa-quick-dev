// -----------------------------------------------------------------------------
// Story 2.4 — Edit Client
// Integration test: renders /clientes/:clienteId with the list on the side and
// exercises the end-to-end edit flow (open modal -> submit -> detail + list
// update). Also covers 409, cancel-preserves-original, and empty-validation.
// -----------------------------------------------------------------------------
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { seedClientes } from '@/test/msw/handlers'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('siesa-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('siesa-ui-kit')>('siesa-ui-kit')
  return {
    ...actual,
    toast: Object.assign(vi.fn(), {
      success: (...args: unknown[]) => toastSuccess(...args),
      error: (...args: unknown[]) => toastError(...args),
      warning: vi.fn(),
      info: vi.fn(),
    }),
  }
})

function buildRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const clientesLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => (
      <section className="flex h-full">
        <ClienteListView />
        <Outlet />
      </section>
    ),
  })

  const clienteDetailRoute = createRoute({
    getParentRoute: () => clientesLayoutRoute,
    path: '$clienteId',
    component: function ClienteDetailRoute() {
      const { clienteId } = clienteDetailRoute.useParams()
      return <ClienteDetailView clienteId={clienteId} />
    },
  })

  const routeTree = rootRoute.addChildren([
    clientesLayoutRoute.addChildren([clienteDetailRoute]),
  ])

  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

function withQuery(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0 },
      mutations: { retry: false },
    },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Story 2.4 — clientes/edit integration', () => {
  it('happy path: opens modal pre-filled → submits → modal closes, detail reflects new nombre, toast success', async () => {
    toastSuccess.mockReset()
    const target = seedClientes[0] // Acme Corp
    const user = userEvent.setup()
    render(withQuery(<RouterProvider router={buildRouter(`/clientes/${target.id}`)} />))

    await screen.findByTestId('cliente-detail-panel')
    await user.click(screen.getByTestId('cliente-editar-button'))
    await screen.findByTestId('cliente-form-modal')

    // Pre-filled
    expect(screen.getByTestId('cliente-form-nombre')).toHaveValue(target.nombre)
    expect(screen.getByTestId('cliente-form-nit')).toHaveValue(target.nit)

    const nombre = screen.getByTestId('cliente-form-nombre')
    await user.clear(nombre)
    await user.type(nombre, 'Acme Updated')
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(screen.queryByTestId('cliente-form-modal')).not.toBeInTheDocument(),
    )
    expect(toastSuccess).toHaveBeenCalledWith(
      'Cliente actualizado correctamente',
      expect.objectContaining({ color: 'green' }),
    )

    // Detail heading reflects the new nombre (via ['clientes', id] cache set).
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toHaveTextContent(
        'Acme Updated',
      )
    })
  })

  it('409 flow: keeps modal open with inline NIT error, no red toast, no leak', async () => {
    toastError.mockReset()
    const target = seedClientes[0] // Acme
    const user = userEvent.setup()
    render(withQuery(<RouterProvider router={buildRouter(`/clientes/${target.id}`)} />))

    await screen.findByTestId('cliente-detail-panel')
    await user.click(screen.getByTestId('cliente-editar-button'))
    await screen.findByTestId('cliente-form-modal')

    const nit = screen.getByTestId('cliente-form-nit')
    await user.clear(nit)
    // NIT of Beta (a DIFFERENT row in the MSW seed) → default handler returns 409.
    await user.type(nit, '800987654-3')
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent(
        'El NIT/RUC ya está registrado',
      ),
    )
    expect(screen.getByTestId('cliente-form-modal')).toBeInTheDocument()
    expect(toastError).not.toHaveBeenCalled()

    const html = document.body.innerHTML
    expect(html).not.toContain('Ya existe un cliente con el NIT/RUC indicado.')
    expect(html).not.toContain('NIT/RUC duplicado')
  })

  it('cancel preserves original: modal closes without submit, detail still shows original nombre', async () => {
    const target = seedClientes[0]
    const user = userEvent.setup()
    render(withQuery(<RouterProvider router={buildRouter(`/clientes/${target.id}`)} />))

    await screen.findByTestId('cliente-detail-panel')
    await user.click(screen.getByTestId('cliente-editar-button'))
    await screen.findByTestId('cliente-form-modal')

    const nombre = screen.getByTestId('cliente-form-nombre')
    await user.clear(nombre)
    await user.type(nombre, 'Modified But Not Saved')
    await user.click(screen.getByTestId('cliente-form-cancel'))

    await waitFor(() =>
      expect(screen.queryByTestId('cliente-form-modal')).not.toBeInTheDocument(),
    )
    // Detail heading still shows the ORIGINAL nombre.
    expect(screen.getByTestId('cliente-detail-panel')).toHaveTextContent(target.nombre)
    expect(screen.getByTestId('cliente-detail-panel')).not.toHaveTextContent(
      'Modified But Not Saved',
    )
  })

  it('empty required field: shows inline error and does NOT send a PUT', async () => {
    const target = seedClientes[0]
    const user = userEvent.setup()
    render(withQuery(<RouterProvider router={buildRouter(`/clientes/${target.id}`)} />))

    await screen.findByTestId('cliente-detail-panel')
    await user.click(screen.getByTestId('cliente-editar-button'))
    await screen.findByTestId('cliente-form-modal')

    const nombre = screen.getByTestId('cliente-form-nombre')
    await user.clear(nombre)
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nombre-error')).toHaveTextContent(
        'El nombre es requerido',
      ),
    )
    // Modal still open.
    expect(screen.getByTestId('cliente-form-modal')).toBeInTheDocument()
    // Detail unchanged.
    expect(screen.getByTestId('cliente-detail-panel')).toHaveTextContent(target.nombre)
  })
})
