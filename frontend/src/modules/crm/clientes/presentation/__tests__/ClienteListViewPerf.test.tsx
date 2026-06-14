/**
 * Story 2.1: Client List & Search — NFR1 Performance Tests
 *
 * Extracted from ClienteListView.test.tsx to keep each file under 300 lines.
 *
 * Acceptance Criteria covered:
 *   AC#2 / NFR1 — Search over 500 records completes in under 1 second
 *
 * Test case from test-design-epic-2.md:
 *   TC-E2-P0-05: Search perf 500 records ≤150ms (AC#2 / NFR1)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ClienteListView } from '../ClienteListView'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Test Wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

const noop = () => {}

// ─── AC#2 / NFR1: Search Performance with 500 Records ─────────────────────────

describe('ClienteListView — AC#2 / NFR1: Search performance (TC-E2-P0-05)', () => {
  it('should filter 500 records in under 150ms (NFR1 requirement)', async () => {
    // GIVEN: 500 clients loaded via MSW
    const clientes500 = [
      ...Array.from({ length: 50 }, (_, i) =>
        createCliente({ nombre: `Empresa Siesa ${i}`, nit: `900${i.toString().padStart(6, '0')}-1` })
      ),
      ...Array.from({ length: 450 }, (_, i) =>
        createCliente({ nombre: `Otro Proveedor ${i}`, nit: `800${i.toString().padStart(6, '0')}-2` })
      ),
    ]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes500))
    )

    const user = userEvent.setup()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    })

    // WHEN: user types a search term — measure elapsed time
    const t0 = performance.now()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'Siesa')
    const elapsed = performance.now() - t0

    // THEN: filter completes in under 150ms (well within NFR1 1s limit)
    expect(elapsed).toBeLessThan(150)

    // AND: only "Empresa Siesa" clients are shown
    const visibleItems = screen.getAllByTestId('cliente-list-item')
    expect(visibleItems.length).toBe(50)
  })
})
