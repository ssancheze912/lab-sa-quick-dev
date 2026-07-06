/**
 * Story 2.1: Client List & Search — NFR1 performance acceptance test
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (fails to compile until `ClienteListView` exists,
 * same RED rationale as `ClienteListView.test.tsx`).
 *
 * AC2 / NFR1: "results render in under 1 second with up to 500 records in the dataset."
 * The Dev Notes mandate a pure in-memory `useMemo` filter over the TanStack Query cache
 * (no debounce, no additional fetch) specifically to satisfy this budget — this test
 * guards against a regression to an O(n^2) or network-per-keystroke implementation.
 *
 * Kept in a dedicated file (per Story 2.1 Task 6: "co-located or dedicated *.test.ts")
 * so the 500-record fixture and `performance.now()` timing assertion don't inflate the
 * primary behavioral spec file, per `test-quality.md`'s file-length guidance.
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

const CLIENTES_ENDPOINT = '*/api/v1/clientes'
const RECORD_COUNT = 500
const PERFORMANCE_BUDGET_MS = 1000

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('NFR1 — search filter stays under 1s at 500 records', () => {
  test('[P1] filters 500 cached clients to a single match in under 1000ms', async () => {
    // GIVEN: 500 clients are loaded into the TanStack Query cache, with one uniquely
    // findable target record among them
    const target = createClientes(1, { nombre: 'Unico Findable Cliente' })[0]
    const noise = createClientes(RECORD_COUNT - 1)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target, ...noise])))

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <ClienteListView />
      </QueryClientProvider>,
    )
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(RECORD_COUNT)
    })

    // WHEN: the user searches for the unique target's Nombre and the filtered render commits
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    const startedAt = performance.now()
    fireEvent.change(searchInput, { target: { value: 'Unico Findable Cliente' } })
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
    const elapsedMs = performance.now() - startedAt

    // THEN: the filtered result rendered well under the 1-second NFR1 budget
    expect(elapsedMs).toBeLessThan(PERFORMANCE_BUDGET_MS)
  })
})
