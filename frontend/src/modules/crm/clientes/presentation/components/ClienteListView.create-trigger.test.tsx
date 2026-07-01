import { describe, test, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CLIENTES_ENDPOINT } from '@/test/msw/handlers'
import { createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

vi.mock('siesa-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('siesa-ui-kit')>('siesa-ui-kit')
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

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

  // --- Edge cases (testarch-automate expansion) -----------------------------

  test('should close the dialog after a successful create (host wiring, AC #2)', async () => {
    // GIVEN the client list is rendered with the create dialog open and filled
    server.use(http.post(CLIENTES_ENDPOINT, () => HttpResponse.json({}, { status: 201 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')
    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    await screen.findByRole('dialog')

    await user.type(screen.getByLabelText(/^nombre$/i), 'Cliente Cierre Dialogo')
    await user.type(screen.getByLabelText(/nit\/ruc/i), '900999888')
    await user.type(screen.getByLabelText(/tel[ée]fono/i), '3001112233')
    await user.type(screen.getByLabelText(/^ciudad$/i), 'Bogotá')

    // WHEN the user submits and the backend accepts the creation
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the dialog closes automatically (ClienteListView wires onSuccess to
    // close, so the user isn't left staring at a stale form after success)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  test('should close the dialog when the user cancels without submitting', async () => {
    // GIVEN the client list is rendered with the create dialog open
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')
    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    await screen.findByRole('dialog')

    // WHEN the user triggers Escape to cancel (AlertDialog's default cancel path)
    await user.keyboard('{Escape}')

    // THEN the dialog closes without creating a client
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  test('should reopen with a fresh, empty form after being closed and re-triggered', async () => {
    // GIVEN the dialog was opened, partially filled, then closed via Escape
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')
    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    await screen.findByRole('dialog')
    await user.type(screen.getByLabelText(/^nombre$/i), 'Texto Temporal')
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // WHEN the user reopens "Nuevo cliente"
    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    await screen.findByRole('dialog')

    // THEN the Nombre field is empty again (fresh form instance, no stale state)
    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('')
  })
})
