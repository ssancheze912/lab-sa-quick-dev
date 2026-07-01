import { describe, test, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CLIENTES_ENDPOINT } from '@/test/msw/handlers'
import { createCliente, createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

// RED PHASE: ClienteListView.tsx does not exist yet. This test isolates
// NFR1 ("<1s with up to 500 records") from the functional ClienteListView
// suite per test-design-epic-2.md TC-E2-P1-02, so a perf regression failure
// is never conflated with a functional assertion failure (test-quality.md:
// one concern per test file/assertion).

describe('ClienteListView - NFR1 performance (TC-E2-P1-02)', () => {
  test('should render the filtered list in under 1000ms with 500 seeded clients', async () => {
    // GIVEN: 500 clients are loaded, including one uniquely-named target
    const target = createCliente({ nombre: 'Cliente Objetivo Único' })
    const clientes = [...createClientes(499), target]
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
    const user = userEvent.setup()

    renderWithRouter(<ClienteListView />, { initialPath: '/clientes', withQueryClient: true })
    await screen.findAllByTestId('cliente-list-item')
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)

    // WHEN: the user types a search query that narrows the 500-record set
    const start = performance.now()
    await user.type(screen.getByTestId('cliente-search-input'), 'Cliente Objetivo Único')

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
    const elapsed = performance.now() - start

    // THEN: the filtered DOM update completes in under 1 second end-to-end (NFR1)
    expect(elapsed).toBeLessThan(1000)
  })
})
