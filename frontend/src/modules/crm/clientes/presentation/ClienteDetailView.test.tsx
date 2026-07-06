/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until `ClienteDetailView` (and its supporting
 * `useCliente` hook + `clienteApiRepository.getById`) are implemented per Story 2.2
 * Tasks 3 and 5. Today the whole file fails to compile because `ClienteDetailView` does not
 * exist yet — this is the expected RED state (missing implementation, not a test bug),
 * consistent with `ClienteListView.test.tsx`'s established ATDD convention.
 *
 * Acceptance Criteria covered:
 *   AC1/AC2 — the detail panel (`cliente-detail-panel`) renders Nombre, NIT/RUC, Teléfono
 *             and Ciudad once `GET /api/v1/clientes/:id` resolves successfully. Rendering
 *             itself is identical whether the view is reached via list-item click (AC1) or
 *             a direct/fresh URL load (AC2), since both go through the same `useCliente`
 *             hook — so this component-level suite covers both ACs without duplicating
 *             navigation mechanics (those are exercised at the E2E level instead).
 *   AC3       — a graceful not-found message (`cliente-not-found`, reusing `EmptyState`) is
 *               shown when the query resolves 404, instead of a crash/blank screen; the raw
 *               backend error is never rendered (NFR6) when the query resolves 500.
 *
 * Story 2.4 (Edit Client) addition — ATDD Acceptance Tests, RED phase:
 *   AC1 — an "Editar" button renders once the client loads, and clicking it opens the
 *         `ClienteForm` dialog (in edit mode) with the loaded client's Nombre already visible.
 *         RED phase: fails today because `ClienteDetailView` renders no "Editar" button and
 *         mounts no `ClienteForm` yet (Story 2.4 Task 5).
 *
 * Story 2.5 (Delete Client): the "Eliminar" button / confirmation dialog / cancel / confirm
 * tests originally added here were extracted to the sibling file
 * `ClienteDetailView.delete.test.tsx` by the `testarch-test-review` workflow, once this file
 * crossed the project's <300-line-per-file standard (it reached 471 lines). See that file's
 * header comment for the full AC1-AC3 coverage description. Pure extraction, zero behavior
 * changes — mirrors the `ClienteForm.edit.test.tsx` → `ClienteForm.edit.submit.test.tsx` split
 * already established in Story 2.4's test-quality review.
 *
 * Required data-testid attributes (documented for DEV team, see ATDD checklist):
 *   - `cliente-detail-panel`    — wrapper around the whole detail view
 *   - `cliente-detail-nombre`   — Nombre value
 *   - `cliente-detail-nit`     — NIT/RUC value
 *   - `cliente-detail-telefono` — Teléfono value
 *   - `cliente-detail-ciudad`   — Ciudad value
 *   - `cliente-not-found`      — `EmptyState` variant rendered on 404 (AC #3)
 *   - `error-panel`            — rendered by the shared `ErrorPanel` component on genuine failures
 *
 * Network-first pattern (network-first.md): every test registers its MSW handler via
 * `server.use(...)` BEFORE rendering `ClienteDetailView`, since TanStack Query fires the
 * `GET /api/v1/clientes/:id` request on mount (`enabled: !!clienteId`).
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createCliente } from '@/test/factories/cliente.factory'
import { ClienteDetailView } from './ClienteDetailView'

// Wildcard origin + path-param match: robust regardless of how VITE_API_URL resolves in the
// test env (see `ClienteListView.test.tsx`'s identical rationale for `CLIENTES_ENDPOINT`).
const CLIENTE_BY_ID_ENDPOINT = '*/api/v1/clientes/:id'

function renderClienteDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AC1/AC2 — full client detail renders once GET /api/v1/clientes/:id resolves', () => {
  test('[P0] renders the client Nombre inside cliente-detail-nombre', async () => {
    // GIVEN the backend returns a client named "Acme Corp"
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))

    // WHEN ClienteDetailView mounts for that client's Id and the query resolves
    renderClienteDetailView(cliente.id)
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN the Nombre is visible in its dedicated field
    await waitFor(() => {
      expect(within(panel).getByTestId('cliente-detail-nombre')).toHaveTextContent('Acme Corp')
    })
  })

  test('[P0] renders the client NIT/RUC inside cliente-detail-nit', async () => {
    // GIVEN the backend returns a client with NIT "900123456"
    const cliente = createCliente({ nit: '900123456' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))

    // WHEN ClienteDetailView mounts for that client's Id and the query resolves
    renderClienteDetailView(cliente.id)
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN the NIT/RUC is visible in its dedicated field
    await waitFor(() => {
      expect(within(panel).getByTestId('cliente-detail-nit')).toHaveTextContent('900123456')
    })
  })

  test('[P0] renders the client Teléfono inside cliente-detail-telefono', async () => {
    // GIVEN the backend returns a client with Teléfono "3001234567"
    const cliente = createCliente({ telefono: '3001234567' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))

    // WHEN ClienteDetailView mounts for that client's Id and the query resolves
    renderClienteDetailView(cliente.id)
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN the Teléfono is visible in its dedicated field
    await waitFor(() => {
      expect(within(panel).getByTestId('cliente-detail-telefono')).toHaveTextContent('3001234567')
    })
  })

  test('[P0] renders the client Ciudad inside cliente-detail-ciudad', async () => {
    // GIVEN the backend returns a client with Ciudad "Cartagena"
    const cliente = createCliente({ ciudad: 'Cartagena' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))

    // WHEN ClienteDetailView mounts for that client's Id and the query resolves
    renderClienteDetailView(cliente.id)
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN the Ciudad is visible in its dedicated field
    await waitFor(() => {
      expect(within(panel).getByTestId('cliente-detail-ciudad')).toHaveTextContent('Cartagena')
    })
  })
})

describe('AC3 — graceful not-found when GET /api/v1/clientes/:id resolves 404', () => {
  test('[P0] renders cliente-not-found (EmptyState variant) instead of a crash or blank panel', async () => {
    // GIVEN the requested clienteId does not exist in the system
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => new HttpResponse(null, { status: 404 })))

    // WHEN ClienteDetailView mounts and the query resolves 404
    renderClienteDetailView('non-existent-cliente-id')

    // THEN the graceful not-found message renders, reusing EmptyState's testId prop
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
  })

  test('[P1] does not render any detail field when the client is not found', async () => {
    // GIVEN the requested clienteId does not exist in the system
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => new HttpResponse(null, { status: 404 })))

    // WHEN ClienteDetailView mounts and the query resolves 404
    renderClienteDetailView('non-existent-cliente-id')
    await screen.findByTestId('cliente-not-found')

    // THEN none of the populated-detail fields render alongside the not-found state
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
  })
})

describe('AC — ErrorPanel displayed on a genuine load failure, distinct from not-found (NFR6)', () => {
  test('[P0] renders the error-panel with "No se pudo cargar" when GET /api/v1/clientes/:id fails with 500', async () => {
    // GIVEN the backend fails unexpectedly
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })),
    )

    // WHEN ClienteDetailView mounts and the query rejects
    renderClienteDetailView('some-cliente-id')

    // THEN the ErrorPanel is displayed with the fixed, safe copy — not the not-found state
    const errorPanel = await screen.findByTestId('error-panel')
    expect(within(errorPanel).getByText('No se pudo cargar')).toBeInTheDocument()
  })

  test('[P2] never renders the raw backend error/exception message (NFR6)', async () => {
    // GIVEN the backend fails with a technical, exception-shaped payload
    const technicalMarker = 'NpgsqlException: connection refused at 10.0.0.5:5432'
    server.use(
      http.get(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json({ detail: technicalMarker }, { status: 500 }),
      ),
    )

    // WHEN ClienteDetailView mounts and the query rejects
    renderClienteDetailView('some-cliente-id')
    await screen.findByTestId('error-panel')

    // THEN the raw technical error text is never rendered to the user
    expect(screen.queryByText(technicalMarker)).not.toBeInTheDocument()
  })

  test('[P2] does not render cliente-not-found on a genuine 500 failure', async () => {
    // GIVEN the backend fails unexpectedly (not a 404)
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })))

    // WHEN ClienteDetailView mounts and the query rejects
    renderClienteDetailView('some-cliente-id')
    await screen.findByTestId('error-panel')

    // THEN the not-found EmptyState variant (reserved for 404) does not also render
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })
})

describe('Story 2.4 AC1 — "Editar" button opens the edit dialog pre-filled with the client', () => {
  test('[P0] renders an "Editar" button once the client loads', async () => {
    // GIVEN the backend returns a client
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))

    // WHEN ClienteDetailView mounts and the query resolves
    renderClienteDetailView(cliente.id)

    // THEN an "Editar" button is rendered
    expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  test('[P0] clicking "Editar" opens a dialog', async () => {
    // GIVEN the backend returns a client and the detail view has loaded
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))
    renderClienteDetailView(cliente.id)
    const editButton = await screen.findByRole('button', { name: /editar/i })

    // WHEN the user clicks "Editar"
    fireEvent.click(editButton)

    // THEN the ClienteForm dialog opens
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  test('[P0] the opened dialog shows the loaded client\'s Nombre already filled in', async () => {
    // GIVEN the backend returns a client named "Acme Corp" and the detail view has loaded
    const cliente = createCliente({ nombre: 'Acme Corp' })
    server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente)))
    renderClienteDetailView(cliente.id)
    const editButton = await screen.findByRole('button', { name: /editar/i })

    // WHEN the user clicks "Editar"
    fireEvent.click(editButton)
    await screen.findByRole('dialog')

    // THEN the corresponding Nombre input already shows the loaded client's current value
    // (AC #1 — pre-filled with the client's current values)
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toHaveValue('Acme Corp')
    })
  })
})
