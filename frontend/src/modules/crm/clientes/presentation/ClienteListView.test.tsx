/**
 * Story 2.1 — Client List & Search — ClienteListView ATDD (RED phase).
 *
 * Aligned test cases (test-design-epic-2.md):
 *   TC-E2-P1-08 — Dual-panel layout 280px              (AC #3)
 *   TC-E2-P2-04 — Search matches Nombre + NIT/RUC      (AC #4)
 *   TC-E2-P2-01 — EmptyState when zero clients          (AC #5)
 *   TC-E2-P1-07 — ErrorPanel + Reintentar recovery     (AC #6)
 *   TC-E2-P0-04 (UI leg) — Search < 1 s with 500 rows  (AC #4 / NFR1)
 *   AC #7        — Skeleton loaders during pending
 *
 * MUST fail until modules/crm/clientes/presentation/ClienteListView.tsx is built.
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import type { ReactElement } from 'react'

import { server } from '@/mocks/server'
import {
  buildClienteFixture,
  buildClienteFixtures,
  clienteHandlers,
  clienteHandlersEmpty,
  clienteHandlersError,
} from '@/mocks/handlers/clientes'
import { ClienteListView } from './ClienteListView'

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ClienteListView — Story 2.1 ATDD', () => {
  // ─── AC #7 — skeletons during pending ────────────────────────────────
  test('AC #7 — renders 5 skeletons in a status region while initial GET is pending', async () => {
    // GIVEN: a slow GET so the pending state is observable
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await delay(800)
        return HttpResponse.json([])
      })
    )

    // WHEN: ClienteListView mounts
    renderWithQueryClient(<ClienteListView />)

    // THEN: skeleton container exposes role=status, aria-busy=true, aria-label
    const skeletonContainer = await screen.findByTestId('client-list-skeleton')
    expect(skeletonContainer).toHaveAttribute('role', 'status')
    expect(skeletonContainer).toHaveAttribute('aria-busy', 'true')
    expect(skeletonContainer).toHaveAttribute('aria-label', 'Cargando clientes')
    expect(screen.getAllByTestId('client-list-skeleton-item')).toHaveLength(5)
  })

  // ─── AC #3 / TC-E2-P1-08 — dual-panel layout 280px ───────────────────
  test('TC-E2-P1-08 / AC #3 — the panel exposes data-testid="client-list-panel" with w-[280px]', async () => {
    // GIVEN: 1 client fixture
    server.use(...clienteHandlers([buildClienteFixture({ nombre: 'ACME' })]))

    // WHEN: ClienteListView mounts
    renderWithQueryClient(<ClienteListView />)

    // THEN: the panel uses the w-[280px] Tailwind class (exact width per UX spec)
    const panel = await screen.findByTestId('client-list-panel')
    expect(panel.tagName).toBe('ASIDE')
    expect(panel.className).toContain('w-[280px]')
  })

  // ─── AC #3 — items show Nombre + NIT/RUC ─────────────────────────────
  test('AC #3 — each client renders Nombre and NIT/RUC inside the list', async () => {
    // GIVEN: 2 client fixtures with distinct nombre/nit
    const a = buildClienteFixture({ nombre: 'ACME Ltda', nitRuc: '900111222' })
    const b = buildClienteFixture({ nombre: 'Beta SAS', nitRuc: '800999888' })
    server.use(...clienteHandlers([a, b]))

    // WHEN: ClienteListView mounts
    renderWithQueryClient(<ClienteListView />)

    // THEN: both clients render with both fields
    expect(await screen.findByText('ACME Ltda')).toBeInTheDocument()
    expect(await screen.findByText('900111222')).toBeInTheDocument()
    expect(await screen.findByText('Beta SAS')).toBeInTheDocument()
    expect(await screen.findByText('800999888')).toBeInTheDocument()
  })

  // ─── AC #4 / TC-E2-P2-04 — search filter (client-side, no fetch) ─────
  test('TC-E2-P2-04 / AC #4 — typing in search filters the list by Nombre, client-side, no extra fetch', async () => {
    // GIVEN: 3 fixtures and a request spy on GET /clientes
    const a = buildClienteFixture({ nombre: 'Distribuidora ZetaUnique' })
    const b = buildClienteFixture({ nombre: 'Almacenes Beta' })
    const c = buildClienteFixture({ nombre: 'Comercial Gamma' })
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        getCount += 1
        return HttpResponse.json([a, b, c])
      })
    )
    const user = userEvent.setup()

    // WHEN: list mounts, then user types a fragment
    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByText('Distribuidora ZetaUnique')).toBeInTheDocument()
    expect(screen.getByText('Almacenes Beta')).toBeInTheDocument()
    expect(screen.getByText('Comercial Gamma')).toBeInTheDocument()

    const fetchesBefore = getCount
    const searchInput = screen.getByTestId('client-search-input')
    await user.type(searchInput, 'ZetaUnique')

    // THEN: only the matching client is visible; no additional GET fired
    await waitFor(() => {
      expect(screen.getByText('Distribuidora ZetaUnique')).toBeInTheDocument()
      expect(screen.queryByText('Almacenes Beta')).not.toBeInTheDocument()
      expect(screen.queryByText('Comercial Gamma')).not.toBeInTheDocument()
    })
    expect(getCount).toBe(fetchesBefore)
  })

  test('AC #4 — search also matches by NIT/RUC, case-insensitively', async () => {
    // GIVEN: 2 fixtures with distinct NITs
    const a = buildClienteFixture({ nombre: 'ACME', nitRuc: '900111222' })
    const b = buildClienteFixture({ nombre: 'Beta', nitRuc: '800999888' })
    server.use(...clienteHandlers([a, b]))
    const user = userEvent.setup()

    // WHEN: list mounts, then user types a NIT fragment
    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByText('ACME')).toBeInTheDocument()
    await user.type(screen.getByTestId('client-search-input'), '900111')

    // THEN: only the NIT-matching client survives
    await waitFor(() => {
      expect(screen.getByText('ACME')).toBeInTheDocument()
      expect(screen.queryByText('Beta')).not.toBeInTheDocument()
    })
  })

  // ─── AC #5 / TC-E2-P2-01 — no-clients EmptyState ─────────────────────
  test('TC-E2-P2-01 / AC #5 — backend returns [] → no-clients EmptyState is rendered', async () => {
    // GIVEN: backend returns an empty list
    server.use(...clienteHandlersEmpty())

    // WHEN: list mounts
    renderWithQueryClient(<ClienteListView />)

    // THEN: the no-clients EmptyState appears with the UX-spec copy
    expect(await screen.findByTestId('empty-state-no-clients')).toBeInTheDocument()
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
    expect(screen.getByText('Crea el primer cliente del sistema')).toBeInTheDocument()
  })

  // ─── AC #5 — search-empty EmptyState ─────────────────────────────────
  test('AC #5 — cache non-empty + zero filter matches → search-empty EmptyState', async () => {
    // GIVEN: 2 fixtures
    server.use(...clienteHandlers([
      buildClienteFixture({ nombre: 'ACME' }),
      buildClienteFixture({ nombre: 'Beta' }),
    ]))
    const user = userEvent.setup()

    // WHEN: list mounts, user searches for an unmatchable string
    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByText('ACME')).toBeInTheDocument()
    await user.type(screen.getByTestId('client-search-input'), 'XYZUNMATCHABLE')

    // THEN: search-empty EmptyState renders
    expect(await screen.findByTestId('empty-state-search-empty')).toBeInTheDocument()
    expect(screen.getByText('No se encontró ningún cliente')).toBeInTheDocument()
    expect(screen.getByText('Intenta con otro nombre o NIT')).toBeInTheDocument()
  })

  // ─── AC #6 / TC-E2-P1-07 — ErrorPanel + Reintentar ───────────────────
  test('TC-E2-P1-07 / AC #6 — initial GET fails → ErrorPanel + Reintentar recovers', async () => {
    // GIVEN: first GET → 500, second GET → 1 client
    let calls = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        calls += 1
        if (calls === 1) {
          return HttpResponse.json(
            { type: 'about:blank', title: 'Error', status: 500 },
            { status: 500 }
          )
        }
        return HttpResponse.json([buildClienteFixture({ nombre: 'Recovered Client' })])
      })
    )
    const user = userEvent.setup()

    // WHEN: list mounts → ErrorPanel renders → user clicks Reintentar
    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByTestId('error-panel')).toBeInTheDocument()
    expect(screen.getByText('No pudimos cargar los clientes')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: list renders, error panel is gone
    expect(await screen.findByText('Recovered Client')).toBeInTheDocument()
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  test('AC #6 — ErrorPanel does NOT leak technical detail (NFR6)', async () => {
    // GIVEN: backend returns 500 with a Problem Details body
    server.use(...clienteHandlersError())

    // WHEN: list mounts
    renderWithQueryClient(<ClienteListView />)
    const panel = await screen.findByTestId('error-panel')

    // THEN: no status code, URL, or problem-details strings are surfaced
    expect(panel.textContent ?? '').not.toMatch(/500|404|about:blank|http|api\/v1/i)
  })

  // ─── AC #4 / TC-E2-P0-04 (UI leg) — perf with 500 fixtures ───────────
  test('TC-E2-P0-04 (UI leg) — typing into search renders filtered list in < 1000ms with 500 fixtures', async () => {
    // GIVEN: a 500-record fixture
    const fixtures = buildClienteFixtures(500)
    // Make the 250th item uniquely identifiable
    fixtures[249] = { ...(fixtures[249] as (typeof fixtures)[number]), nombre: 'TargetUniqueClient' }
    server.use(...clienteHandlers(fixtures))
    const user = userEvent.setup()

    // WHEN: list mounts and user types a query that yields exactly 1 match
    renderWithQueryClient(<ClienteListView />)
    expect(await screen.findByText('TargetUniqueClient')).toBeInTheDocument()

    const before = performance.now()
    await user.type(screen.getByTestId('client-search-input'), 'TargetUniqueClient')
    await waitFor(() => {
      expect(screen.getByText('TargetUniqueClient')).toBeInTheDocument()
    })
    const elapsed = performance.now() - before

    // THEN: filter resolved within the NFR1 budget
    expect(elapsed).toBeLessThan(1000)
  })

  // ─── AC #4 — search input attributes (accessibility + placeholder) ───
  test('AC #4 — search input has the spec-mandated placeholder and aria-label', async () => {
    server.use(...clienteHandlers([buildClienteFixture()]))
    renderWithQueryClient(<ClienteListView />)
    const input = await screen.findByTestId('client-search-input')
    expect(input).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC')
    expect(input).toHaveAttribute('aria-label', 'Buscar clientes')
  })
})
