/**
 * Story 2.5 — component tests for `ClienteDeleteDialog`.
 *
 * Covers AC #11 (sub-cases relevant to the delete dialog):
 *   - renders title + Cancelar/Confirmar with initial focus on Cancelar
 *   - Cancel button + Esc close WITHOUT firing the DELETE
 *   - Confirm + 204 → success toast + close + navigate + cache invalidate + cache remove
 *   - Confirm + 204 with X-Contactos-Orphaned header → compound toast
 *   - Confirm + 404 → informational toast (soft-success) + close + navigate
 *   - Confirm + 500 → dialog stays open + red toast + Confirmar re-enabled
 *   - Confirm + network error → same as 500 path
 */

import {
  describe,
  expect,
  test,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from 'vitest'

const { toastSuccessMock, toastErrorMock, toastInfoMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
}))

vi.mock('siesa-ui-kit', () => ({
  ToastProvider: ({ children }: { children?: React.ReactNode }) => children,
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    info: toastInfoMock,
  },
}))

import type { ReactElement } from 'react'
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react'
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
import { ClienteDeleteDialog } from '../ClienteDeleteDialog'

const CLIENTE_ID = '00000000-0000-0000-0000-000000000333'

let deleteCount = 0

const server = setupServer(
  http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
    deleteCount += 1
    return new HttpResponse(null, { status: 204 })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  deleteCount = 0
  toastSuccessMock.mockClear()
  toastErrorMock.mockClear()
  toastInfoMock.mockClear()
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Render helper — wraps in QueryClient + Router so `useRouter` resolves and
// `router.navigate({ to: '/clientes' })` finds a matching route.
// ─────────────────────────────────────────────────────────────────────────────

interface RenderResult {
  client: QueryClient
  initialPath: string
  getCurrentPath: () => string
}

function renderDialog(
  ui: ReactElement,
  initialPath = `/clientes/${CLIENTE_ID}`,
): RenderResult {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

  const rootRoute = createRootRoute({ component: () => <Outlet /> })
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

  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return {
    client,
    initialPath,
    getCurrentPath: () => router.state.location.pathname,
  }
}

describe('ClienteDeleteDialog — Story 2.5', () => {
  test('ClienteDeleteDialog_renders_title_and_two_buttons_with_initial_focus_on_cancel', async () => {
    renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={() => {}}
        clienteId={CLIENTE_ID}
      />,
    )

    const dialog = await screen.findByTestId('cliente-delete-dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('role', 'alertdialog')
    expect(
      screen.getByRole('heading', { name: /¿eliminar este cliente\?/i }),
    ).toBeInTheDocument()

    const cancelar = screen.getByTestId('btn-cancelar-eliminar')
    const confirmar = screen.getByTestId('btn-confirmar-eliminar')
    expect(cancelar).toBeInTheDocument()
    expect(confirmar).toBeInTheDocument()
    expect(confirmar).toHaveTextContent(/confirmar/i)

    await waitFor(() => expect(cancelar).toHaveFocus())
  })

  test('ClienteDeleteDialog_cancel_button_closes_without_request', async () => {
    const onOpenChange = vi.fn()
    renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={onOpenChange}
        clienteId={CLIENTE_ID}
      />,
    )

    await screen.findByTestId('cliente-delete-dialog')

    fireEvent.click(screen.getByTestId('btn-cancelar-eliminar'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(deleteCount).toBe(0)
    expect(toastSuccessMock).not.toHaveBeenCalled()
    expect(toastErrorMock).not.toHaveBeenCalled()
  })

  test('ClienteDeleteDialog_esc_closes_without_request', async () => {
    const onOpenChange = vi.fn()
    renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={onOpenChange}
        clienteId={CLIENTE_ID}
      />,
    )

    await screen.findByTestId('cliente-delete-dialog')

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
      code: 'Escape',
    })

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(deleteCount).toBe(0)
  })

  test('ClienteDeleteDialog_confirm_204_fires_success_toast_and_navigates', async () => {
    const onOpenChange = vi.fn()
    const { client, getCurrentPath } = renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={onOpenChange}
        clienteId={CLIENTE_ID}
      />,
    )

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const removeSpy = vi.spyOn(client, 'removeQueries')

    await screen.findByTestId('cliente-delete-dialog')

    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Cliente eliminado correctamente',
        expect.objectContaining({ duration: 3000 }),
      ),
    )

    expect(deleteCount).toBe(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: ['clientes', CLIENTE_ID],
    })

    await waitFor(() => expect(getCurrentPath()).toBe('/clientes'))
  })

  test('ClienteDeleteDialog_confirm_204_with_orphan_header_shows_compound_toast', async () => {
    server.use(
      http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        deleteCount += 1
        return new HttpResponse(null, {
          status: 204,
          headers: { 'X-Contactos-Orphaned': '2' },
        })
      }),
    )

    const onOpenChange = vi.fn()
    renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={onOpenChange}
        clienteId={CLIENTE_ID}
      />,
    )

    await screen.findByTestId('cliente-delete-dialog')
    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
        expect.objectContaining({ duration: 5000 }),
      ),
    )

    expect(deleteCount).toBe(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('ClienteDeleteDialog_confirm_404_treats_as_success_with_informational_toast', async () => {
    server.use(
      http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        deleteCount += 1
        return new HttpResponse(
          JSON.stringify({
            status: 404,
            title: 'Cliente no encontrado.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        )
      }),
    )

    const onOpenChange = vi.fn()
    const { client, getCurrentPath } = renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={onOpenChange}
        clienteId={CLIENTE_ID}
      />,
    )

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const removeSpy = vi.spyOn(client, 'removeQueries')

    await screen.findByTestId('cliente-delete-dialog')
    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    await waitFor(() =>
      expect(toastInfoMock).toHaveBeenCalledWith(
        'Cliente no encontrado. La lista se actualizó.',
        expect.objectContaining({ duration: 5000 }),
      ),
    )

    expect(deleteCount).toBe(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: ['clientes', CLIENTE_ID],
    })

    await waitFor(() => expect(getCurrentPath()).toBe('/clientes'))
    // NO red toast on the 404 path.
    expect(toastErrorMock).not.toHaveBeenCalled()
  })

  test('ClienteDeleteDialog_confirm_500_keeps_dialog_open_and_red_toast', async () => {
    server.use(
      http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        deleteCount += 1
        return new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        )
      }),
    )

    const onOpenChange = vi.fn()
    renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={onOpenChange}
        clienteId={CLIENTE_ID}
      />,
    )

    await screen.findByTestId('cliente-delete-dialog')
    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        'No se pudo eliminar. Intenta de nuevo.',
        expect.objectContaining({ duration: 5000 }),
      ),
    )

    expect(deleteCount).toBe(1)
    // Dialog STAYS OPEN — onOpenChange(false) is NEVER called on the 5xx path.
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    // Confirmar button re-enabled (not stuck in disabled state).
    const confirmar = screen.getByTestId('btn-confirmar-eliminar')
    await waitFor(() => expect(confirmar).not.toBeDisabled())
  })

  test('ClienteDeleteDialog_confirm_network_error_keeps_dialog_open_and_red_toast', async () => {
    server.use(
      http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () => HttpResponse.error()),
    )

    const onOpenChange = vi.fn()
    renderDialog(
      <ClienteDeleteDialog
        open
        onOpenChange={onOpenChange}
        clienteId={CLIENTE_ID}
      />,
    )

    await screen.findByTestId('cliente-delete-dialog')
    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        'No se pudo eliminar. Intenta de nuevo.',
        expect.objectContaining({ duration: 5000 }),
      ),
    )

    // Dialog STAYS OPEN.
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
