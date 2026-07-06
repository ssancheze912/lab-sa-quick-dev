/**
 * Story 2.5: Delete Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — extracted from `ClienteDetailView.test.tsx` by the
 * `testarch-test-review` workflow (TEA Agent).
 *
 * Rationale for the split: adding Story 2.5's delete-flow tests directly to
 * `ClienteDetailView.test.tsx` pushed that file to 471 lines — over both the workflow's
 * general 300-line-ideal/500-line-fail matrix and this project's explicit <300-line
 * mandate. This mirrors the exact precedent already established twice in this suite:
 * `ClienteForm.edit.test.tsx` → `ClienteForm.edit.submit.test.tsx` (Story 2.4 test-quality
 * review) and `ClienteEndpointsTests.cs` → `ClienteEndpointsUpdateTests.cs` /
 * `ClienteEndpointsDeleteTests.cs` (backend, Stories 2.4/2.5) — new sibling file per
 * feature/action rather than growing a single file indefinitely. Pure extraction: zero
 * assertion or behavior changes, every test moved verbatim including its GWT comments.
 *
 * Acceptance Criteria covered:
 *   AC1 — an "Eliminar" button renders next to "Editar" once the client loads; clicking it
 *         opens a confirmation dialog (reusing `@/shared/components/ui/dialog`) titled
 *         "¿Eliminar este cliente?" with "Confirmar"/"Cancelar" actions.
 *   AC2 — confirming calls `DELETE /api/v1/clientes/{id}`, shows the success toast
 *         "Cliente eliminado correctamente", closes the dialog, and invokes the optional
 *         `onDeleted` callback prop (the component itself never calls `useNavigate()` — see
 *         Dev Notes; route-level navigation is exercised by `clientes-delete.spec.ts` E2E
 *         instead). "Confirmar" is disabled while the mutation is pending (double-submit
 *         guard, R9).
 *   AC3 — clicking "Cancelar" closes the dialog, sends zero DELETE requests, and leaves the
 *         client record completely unchanged in the panel.
 *
 * Network-first pattern (network-first.md): every test registers its MSW handler via
 * `server.use(...)` BEFORE rendering `ClienteDetailView`, since TanStack Query fires the
 * `GET /api/v1/clientes/:id` request on mount (`enabled: !!clienteId`).
 */

import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { Toaster } from 'sonner'
import { server } from '@/test/msw/server'
import { createCliente } from '@/test/factories/cliente.factory'
import { ClienteDetailView } from './ClienteDetailView'

// Wildcard origin + path-param match: robust regardless of how VITE_API_URL resolves in the
// test env (see `ClienteListView.test.tsx`'s identical rationale for `CLIENTES_ENDPOINT`).
const CLIENTE_BY_ID_ENDPOINT = '*/api/v1/clientes/:id'

function renderClienteDetailView(clienteId: string, onDeleted?: () => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ClienteDetailView clienteId={clienteId} onDeleted={onDeleted} />
    </QueryClientProvider>,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Story 2.5 AC1 — "Eliminar" button opens a confirmation dialog', () => {
  test('[P0] renders an "Eliminar" button once the client loads', async () => {
    // GIVEN the backend returns a client
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))

    // WHEN ClienteDetailView mounts and the query resolves
    renderClienteDetailView(cliente.id)

    // THEN an "Eliminar" button is rendered next to "Editar"
    expect(await screen.findByRole('button', { name: /eliminar/i })).toBeInTheDocument()
  })

  test('[P0] clicking "Eliminar" opens a dialog titled "¿Eliminar este cliente?"', async () => {
    // GIVEN the backend returns a client and the detail view has loaded
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))
    renderClienteDetailView(cliente.id)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })

    // WHEN the user clicks "Eliminar"
    fireEvent.click(deleteButton)

    // THEN a confirmation dialog opens with the exact Spanish title copy
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('¿Eliminar este cliente?')).toBeInTheDocument()
  })

  test('[P0] the confirmation dialog shows "Confirmar" and "Cancelar" actions', async () => {
    // GIVEN the backend returns a client and the detail view has loaded
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))
    renderClienteDetailView(cliente.id)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })

    // WHEN the user clicks "Eliminar"
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // THEN both "Confirmar" and "Cancelar" actions are present in the dialog
    expect(within(dialog).getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})

describe('Story 2.5 AC3 — "Cancelar" discards the delete without any network call', () => {
  test('[P0] closes the dialog and never sends a DELETE when "Cancelar" is clicked', async () => {
    // GIVEN a request counter on the delete endpoint and an open confirmation dialog
    let deleteRequestCount = 0
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(createCliente({ nombre: 'Acme Corp' }))),
      http.delete(CLIENTE_BY_ID_ENDPOINT, () => {
        deleteRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderClienteDetailView('some-cliente-id')
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Cancelar"
    fireEvent.click(within(dialog).getByRole('button', { name: /cancelar/i }))

    // THEN the dialog closes and zero DELETE requests were ever sent
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deleteRequestCount).toBe(0)
  })

  test('[P1] leaves the client record completely unchanged in the panel after "Cancelar"', async () => {
    // GIVEN the backend returns a client and the confirmation dialog is open
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))
    renderClienteDetailView(cliente.id)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Cancelar"
    fireEvent.click(within(dialog).getByRole('button', { name: /cancelar/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // THEN the client is still selected and rendered in the detail panel, unchanged
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Acme Corp')
  })
})

describe('Story 2.5 AC2 — "Confirmar" deletes the client and reports success', () => {
  test('[P0] calls DELETE /api/v1/clientes/:id exactly once on a mocked 204 response', async () => {
    // GIVEN the backend accepts the delete request with 204 No Content
    const cliente = createCliente({ nombre: 'Acme Corp' })
    let deleteRequestCount = 0
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)),
      http.delete(CLIENTE_BY_ID_ENDPOINT, () => {
        deleteRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderClienteDetailView(cliente.id)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Confirmar"
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }))

    // THEN exactly one DELETE request was made
    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })

  test('[P0] shows the success toast "Cliente eliminado correctamente" after a successful delete', async () => {
    // GIVEN the backend accepts the delete request with 204 No Content
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)),
      http.delete(CLIENTE_BY_ID_ENDPOINT, () => new HttpResponse(null, { status: 204 })),
    )
    renderClienteDetailView(cliente.id)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Confirmar"
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }))

    // THEN the exact Spanish success toast copy is rendered
    await waitFor(() => {
      expect(screen.getByText('Cliente eliminado correctamente')).toBeInTheDocument()
    })
  })

  test('[P0] closes the dialog after a successful delete', async () => {
    // GIVEN the backend accepts the delete request with 204 No Content
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)),
      http.delete(CLIENTE_BY_ID_ENDPOINT, () => new HttpResponse(null, { status: 204 })),
    )
    renderClienteDetailView(cliente.id)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Confirmar"
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }))

    // THEN the dialog closes
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('[P0] calls the onDeleted prop after a successful delete', async () => {
    // GIVEN the backend accepts the delete request and an onDeleted spy is passed
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)),
      http.delete(CLIENTE_BY_ID_ENDPOINT, () => new HttpResponse(null, { status: 204 })),
    )
    const onDeleted = vi.fn()
    renderClienteDetailView(cliente.id, onDeleted)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Confirmar"
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }))

    // THEN onDeleted is invoked exactly once — ClienteDetailView is router-agnostic and
    // delegates navigation to the caller (route file), never calling useNavigate() itself
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
  })

  test('[P1] disables "Confirmar" while the delete mutation is pending (R9 double-submit guard)', async () => {
    // GIVEN a delete request that only resolves once the test explicitly releases it
    const cliente = createCliente({ nombre: 'Acme Corp' })
    let releaseResponse: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)),
      http.delete(CLIENTE_BY_ID_ENDPOINT, async () => {
        await pending
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderClienteDetailView(cliente.id)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Confirmar" while the request is still in flight
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }))

    // THEN the "Confirmar" button becomes disabled, preventing a rapid double-click from
    // firing a second DELETE request
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /confirmar/i })).toBeDisabled(),
    )

    // WHEN the request finally resolves
    releaseResponse()
  })
})
