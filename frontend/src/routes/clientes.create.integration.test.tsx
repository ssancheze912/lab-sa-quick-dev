// -----------------------------------------------------------------------------
// Story 2.3 — Create Client
// Integration test: renders the /clientes route with QueryClient + Router and
// exercises the end-to-end create flow (open modal -> submit -> list update).
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
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

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

function buildRouter() {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <ClienteListView />,
  })
  const routeTree = rootRoute.addChildren([clientesRoute])
  const history = createMemoryHistory({ initialEntries: ['/clientes'] })
  return createRouter({ routeTree, history })
}

function withQuery(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Story 2.3 — clientes/create integration', () => {
  it('happy path: open modal → fill form → 201 → modal closes and new cliente appears', async () => {
    toastSuccess.mockReset()
    const user = userEvent.setup()
    render(withQuery(<RouterProvider router={buildRouter()} />))

    await screen.findByTestId('cliente-nuevo-button')
    await user.click(screen.getByTestId('cliente-nuevo-button'))
    await screen.findByTestId('cliente-form-modal')

    await user.type(screen.getByTestId('cliente-form-nombre'), 'Nuevo Cliente SA')
    await user.type(screen.getByTestId('cliente-form-nit'), '999888777-1')
    await user.type(screen.getByTestId('cliente-form-telefono'), '+57 300 555 0000')
    await user.type(screen.getByTestId('cliente-form-ciudad'), 'Medellín')
    await user.click(screen.getByTestId('cliente-form-submit'))

    // Modal closes and toast fires.
    await waitFor(() =>
      expect(screen.queryByTestId('cliente-form-modal')).not.toBeInTheDocument(),
    )
    expect(toastSuccess).toHaveBeenCalledWith(
      'Cliente creado correctamente',
      expect.objectContaining({ color: 'green' }),
    )

    // The new cliente appears at the head of the list.
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items[0]).toHaveTextContent('Nuevo Cliente SA')
    })
  })

  it('409 flow: duplicate NIT keeps modal open, shows inline error, does not leak Problem Details', async () => {
    toastError.mockReset()
    const user = userEvent.setup()
    render(withQuery(<RouterProvider router={buildRouter()} />))

    await screen.findByTestId('cliente-nuevo-button')
    await user.click(screen.getByTestId('cliente-nuevo-button'))
    await screen.findByTestId('cliente-form-modal')

    await user.type(screen.getByTestId('cliente-form-nombre'), 'Duplicate Attempt')
    // NIT of Acme Corp in seed → default MSW handler returns 409.
    await user.type(screen.getByTestId('cliente-form-nit'), '900123456-7')
    await user.type(screen.getByTestId('cliente-form-telefono'), '+57 300')
    await user.type(screen.getByTestId('cliente-form-ciudad'), 'Cali')
    await user.click(screen.getByTestId('cliente-form-submit'))

    // Inline error appears with the exact copy.
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent(
        'El NIT/RUC ya está registrado',
      ),
    )

    // Modal stays open, no red toast, no Problem Details detail leaked.
    expect(screen.getByTestId('cliente-form-modal')).toBeInTheDocument()
    expect(toastError).not.toHaveBeenCalled()
    const html = document.body.innerHTML
    expect(html).not.toContain('Ya existe un cliente con el NIT/RUC indicado.')
    expect(html).not.toContain('NIT/RUC duplicado')
  })
})
