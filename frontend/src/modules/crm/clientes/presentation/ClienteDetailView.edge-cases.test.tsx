/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * Test Automation Expansion (testarch-automate, BMad-Integrated Mode)
 *
 * Expands the ATDD RED-phase suite (`ClienteDetailView.test.tsx`) with edge cases and
 * negative paths NOT covered there: query-key-driven refetch when `clienteId` changes,
 * the `enabled: !!clienteId` guard for an empty id, Unicode/special-character rendering,
 * the pending (loading) state rendering nothing extra, and a genuine network-level failure
 * (no HTTP response at all) exercising the same `isError` → `ErrorPanel` path as an HTTP 500.
 *
 * Same network-first pattern as the ATDD suite: MSW handlers registered via `server.use(...)`
 * before rendering, `onUnhandledRequest: 'error'`.
 *
 * Story 2.5 (Delete Client) addition — Test Automation Expansion:
 * expands the ATDD delete suite with the alternate dialog-close path AC #3 explicitly names
 * ("Cancelar (or closes the dialog via Escape/overlay)") and the DELETE-failure path (never
 * exercised by ATDD, which only mocks a 204 success/408 timeout). Mirrors the exact Escape
 * pattern already established for the edit dialog in `ClienteForm.edit.test.tsx`.
 */

import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/test/msw/server'
import { createCliente } from '@/test/factories/cliente.factory'
import { ClienteDetailView } from './ClienteDetailView'

const CLIENTE_BY_ID_ENDPOINT = '*/api/v1/clientes/:id'

function renderClienteDetailView(clienteId: string, onDeleted?: () => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} onDeleted={onDeleted} />
    </QueryClientProvider>,
  )
  return { ...utils, queryClient }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Query-key-driven refetch — navigating between two different clienteId values', () => {
  test('[P1] re-fetches and renders the new client Nombre when clienteId prop changes', async () => {
    // GIVEN two distinct clients, each served for its own id
    const clienteA = createCliente({ nombre: 'Acme Corp' })
    const clienteB = createCliente({ nombre: 'Beta SAS' })
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, ({ params }) => {
        const id = params.id
        if (id === clienteA.id) return HttpResponse.json(clienteA)
        if (id === clienteB.id) return HttpResponse.json(clienteB)
        return new HttpResponse(null, { status: 404 })
      }),
    )
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteA.id} />
      </QueryClientProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Acme Corp')
    })

    // WHEN the clienteId prop changes (simulating navigation to a different client's route)
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteB.id} />
      </QueryClientProvider>,
    )

    // THEN the panel re-fetches and renders the newly selected client's Nombre
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Beta SAS')
    })
  })
})

describe('enabled: !!clienteId guard — empty clienteId never triggers a request', () => {
  test('[P2] renders no fields, no error and no not-found state when clienteId is an empty string', async () => {
    // GIVEN no MSW handler is registered — any request would fail via onUnhandledRequest: 'error'
    // WHEN ClienteDetailView mounts with an empty clienteId
    renderClienteDetailView('')
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN the panel renders its bare wrapper only — no field, error or not-found sub-state
    // (proves useCliente's `enabled: !!clienteId` guard suppresses the query entirely)
    expect(within(panel).queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(within(panel).queryByTestId('error-panel')).not.toBeInTheDocument()
    expect(within(panel).queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })
})

describe('Pending state — no sub-state renders before the query resolves', () => {
  test('[P2] renders no fields, error or not-found while the request is still in flight', async () => {
    // GIVEN a backend response that is deliberately delayed
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, async () => {
        await delay('infinite')
        return HttpResponse.json(cliente)
      }),
    )

    // WHEN ClienteDetailView mounts and the query is still pending
    renderClienteDetailView(cliente.id)
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN none of the resolved-state sub-views render yet (isPending renders nothing extra,
    // per this story's documented, accepted deferral of a loading indicator)
    expect(within(panel).queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(within(panel).queryByTestId('error-panel')).not.toBeInTheDocument()
    expect(within(panel).queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })
})

describe('Unicode / special-character field rendering', () => {
  test('[P2] renders Nombre and Ciudad with accents, ñ and apostrophes without corruption', async () => {
    // GIVEN a client whose Nombre/Ciudad contain Spanish accents, ñ and an apostrophe
    const cliente = createCliente({
      nombre: "Compañía Ñoño & O'Brien S.A.S.",
      ciudad: 'Bogotá',
    })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))

    // WHEN ClienteDetailView mounts and the query resolves
    renderClienteDetailView(cliente.id)
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN both fields render the exact, uncorrupted Unicode text
    await waitFor(() => {
      expect(within(panel).getByTestId('cliente-detail-nombre')).toHaveTextContent(
        "Compañía Ñoño & O'Brien S.A.S.",
      )
      expect(within(panel).getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá')
    })
  })
})

describe('Genuine network failure (no HTTP response) — distinct from a 404/500 response', () => {
  test('[P1] renders the error-panel (not cliente-not-found) when the request fails at the network level', async () => {
    // GIVEN the request fails outright (e.g. connection refused / DNS failure) — no HTTP
    // response is ever received, so `error.response` is undefined in the repository's catch
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.error()))

    // WHEN ClienteDetailView mounts and the underlying request rejects with a network error
    renderClienteDetailView('some-cliente-id')

    // THEN the generic ErrorPanel renders — the missing `error.response` never satisfies the
    // `status === 404` check, so this correctly falls into the error path, not not-found
    const errorPanel = await screen.findByTestId('error-panel')
    expect(within(errorPanel).getByText('No se pudo cargar')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })
})

describe('Story 2.5 AC3 — delete dialog closes via Escape without sending DELETE (alternate close path)', () => {
  test('[P1] closes the dialog, sends zero DELETE requests, and leaves the record unchanged when Escape is pressed', async () => {
    // GIVEN a request counter on the delete endpoint and an open confirmation dialog — AC #3
    // explicitly covers "Cancelar (or closes the dialog via Escape/overlay)", which the ATDD
    // suite only exercises via the "Cancelar" button click
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

    // WHEN the user presses Escape instead of clicking "Cancelar" or "Confirmar"
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' })

    // THEN the dialog closes, no DELETE request was ever sent, and the client record is
    // still rendered unchanged in the panel
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deleteRequestCount).toBe(0)
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Acme Corp')
  })
})

describe('Story 2.5 AC2 — DELETE failure (500) leaves the dialog open and the record intact', () => {
  test('[P1] keeps the confirmation dialog open and never calls onDeleted when the delete request fails', async () => {
    // GIVEN the backend rejects the delete request with a 500 error — a path the ATDD suite
    // never exercises (it only mocks a 204 success or a still-pending request)
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)),
      http.delete(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })),
    )
    const onDeleted = vi.fn()
    renderClienteDetailView(cliente.id, onDeleted)
    const deleteButton = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteButton)
    const dialog = await screen.findByRole('dialog')

    // WHEN the user clicks "Confirmar" and the request rejects
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }))

    // THEN the mutation settles (its pending state clears) without ever reaching the
    // post-success code path — the dialog stays open, onDeleted is never invoked, and the
    // client record remains visible and unchanged, giving the user a chance to retry
    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: /confirmar/i })).not.toBeDisabled()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Acme Corp')
  })
})
