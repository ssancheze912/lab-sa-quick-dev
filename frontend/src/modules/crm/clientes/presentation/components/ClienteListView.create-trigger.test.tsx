import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CLIENTES_ENDPOINT } from '@/test/msw/handlers'
import { createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

/**
 * Story 2.3 (AC #1) — "Nuevo cliente" trigger hosted on `ClienteListView`.
 *
 * RED PHASE: the "Nuevo cliente" button/dialog composition does not exist yet
 * on `ClienteListView.tsx` (Story 2.3, Task 5). This is additive to the
 * existing list/search rendering established in Story 2.1 — these tests only
 * cover the new trigger, not the list/search behavior already covered by
 * `ClienteListView.test.tsx`.
 *
 * Network-first: `server.use(...)` overrides are registered BEFORE
 * `renderWithRouter` triggers the initial `useClientes()` fetch.
 */
function renderList() {
  const clientes = createClientes(3)
  server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
  return renderWithRouter(<ClienteListView />, { initialPath: '/clientes', withQueryClient: true })
}

describe('ClienteListView - "Nuevo cliente" trigger (Story 2.3, AC #1)', () => {
  test('should render a "Nuevo cliente" button', async () => {
    // GIVEN the client list is rendered
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // THEN a "Nuevo cliente" button is visible
    expect(screen.getByRole('button', { name: /nuevo cliente/i })).toBeInTheDocument()
  })

  test('should open the ClienteForm dialog when "Nuevo cliente" is clicked', async () => {
    // GIVEN the client list is rendered
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN the user clicks "Nuevo cliente"
    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))

    // THEN a dialog opens containing the create form (AC #1)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
  })

  test('should NOT restructure the existing list/search rendering (search input still present)', async () => {
    // GIVEN the client list is rendered
    renderList()

    // THEN the pre-existing search input (Story 2.1) is still present, unmodified
    expect(await screen.findByTestId('cliente-search-input')).toBeInTheDocument()
  })
})
