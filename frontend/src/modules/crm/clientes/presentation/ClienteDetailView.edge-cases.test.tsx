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
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/test/msw/server'
import { createCliente } from '@/test/factories/cliente.factory'
import { ClienteDetailView } from './ClienteDetailView'

const CLIENTE_BY_ID_ENDPOINT = '*/api/v1/clientes/:id'

function renderClienteDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
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
