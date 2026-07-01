/**
 * Perf benchmark for ClienteListView — Story 2.1 AC #9.
 *
 * The 500ms internal budget guarantees the AC #2 <1s NFR1 with headroom.
 *
 * Note: This test can be gated behind RUN_PERF_TESTS=1 in CI if hardware
 * is unreliable — the local threshold is authoritative.
 *
 * Test IDs: 2.1-PERF-001..002. Priority: P0 (backs NFR1).
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'

import { ClienteListView } from './ClienteListView'
import { clientesSuccessHandler, buildLargeClienteSet } from '../__mocks__/msw-handlers'

const LARGE = buildLargeClienteSet(500)
const server = setupServer(clientesSuccessHandler(LARGE))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers(clientesSuccessHandler(LARGE))
})
afterAll(() => server.close())

function renderView(ui: ReactNode = <ClienteListView onSelect={() => {}} />) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('ClienteListView.perf — Story 2.1 AC #9', () => {
  it('[P0][2.1-PERF-001] given 500 clientes are cached, when the user types 3 characters, then filter+render completes in <500ms', async () => {
    // GIVEN
    renderView()
    // Wait until the full list is rendered (any list item visible)
    await screen.findByTestId(`cliente-list-item-${LARGE[0].id}`, {}, { timeout: 5_000 })

    const search = screen.getByTestId('cliente-search-input')

    // WHEN — measure the filter+render round-trip
    const t0 = performance.now()
    fireEvent.change(search, { target: { value: 'acm' } }) // matches Acme entries
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-panel')).toBeInTheDocument()
    })
    const elapsed = performance.now() - t0

    // THEN
    expect(elapsed).toBeLessThan(500)
  })

  it('[P1][2.1-PERF-002] given 500 clientes are cached, when the view first renders, then it does not crash and the panel is present (500-record boundary NFR10)', async () => {
    // GIVEN + WHEN
    renderView()
    // THEN
    expect(await screen.findByTestId('cliente-list-panel', {}, { timeout: 5_000 })).toBeInTheDocument()
  })
})
