import { describe, test, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CONTACTOS_ENDPOINT } from '@/test/msw/handlers'
import { createContactos } from '@/test/factories/contacto.factory'
import { ContactoListView } from './ContactoListView'

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
 * Story 3.3 (AC #1) — "Nuevo contacto" trigger hosted on `ContactoListView`.
 *
 * RED PHASE: the "Nuevo contacto" button/dialog composition does not exist
 * yet on `ContactoListView.tsx` (Story 3.3, Task 5). This is additive to the
 * existing list/search rendering established in Stories 3.1/3.2 — these
 * tests only cover the new trigger, not the list/search/selection behavior
 * already covered by `ContactoListView.test.tsx`. Mirrors
 * `ClienteListView.create-trigger.test.tsx` (Story 2.3 precedent) exactly.
 *
 * Network-first: `server.use(...)` overrides are registered BEFORE
 * `renderWithRouter` triggers the initial `useContactos()` fetch.
 */
function renderList() {
  const contactos = createContactos(3)
  server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))
  return renderWithRouter(<ContactoListView />, { initialPath: '/contactos', withQueryClient: true })
}

describe('ContactoListView - "Nuevo contacto" trigger (Story 3.3, AC #1)', () => {
  test('should render a "Nuevo contacto" button', async () => {
    // GIVEN the contact list is rendered
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // THEN a "Nuevo contacto" button is visible
    expect(screen.getByRole('button', { name: /nuevo contacto/i })).toBeInTheDocument()
  })

  test('should open the ContactoForm dialog when "Nuevo contacto" is clicked', async () => {
    // GIVEN the contact list is rendered
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // WHEN the user clicks "Nuevo contacto"
    await user.click(screen.getByRole('button', { name: /nuevo contacto/i }))

    // THEN a dialog opens containing the create form (AC #1)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
  })

  test('should NOT restructure the existing list/search rendering (search input still present)', async () => {
    // GIVEN the contact list is rendered
    renderList()

    // THEN the pre-existing search input (Stories 3.1/3.2) is still present, unmodified
    expect(await screen.findByTestId('contacto-search-input')).toBeInTheDocument()
  })

  // --- Edge cases -------------------------------------------------------------

  test('should close the dialog after a successful create (host wiring, AC #2)', async () => {
    // GIVEN the contact list is rendered with the create dialog open and filled
    server.use(http.post(CONTACTOS_ENDPOINT, () => HttpResponse.json({}, { status: 201 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')
    await user.click(screen.getByRole('button', { name: /nuevo contacto/i }))
    await screen.findByRole('dialog')

    await user.type(screen.getByLabelText(/^nombre$/i), 'Contacto Cierre Dialogo')
    await user.type(screen.getByLabelText(/^cargo$/i), 'Analista')
    await user.type(screen.getByLabelText(/tel[ée]fono/i), '3001112233')
    await user.type(screen.getByLabelText(/^email$/i), 'cierre.dialogo@ejemplo.co')

    // WHEN the user submits and the backend accepts the creation
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the dialog closes automatically (ContactoListView wires onSuccess
    // to close, so the user isn't left staring at a stale form after success)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  test('should close the dialog when the user cancels without submitting', async () => {
    // GIVEN the contact list is rendered with the create dialog open
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')
    await user.click(screen.getByRole('button', { name: /nuevo contacto/i }))
    await screen.findByRole('dialog')

    // WHEN the user triggers Escape to cancel (AlertDialog's default cancel path)
    await user.keyboard('{Escape}')

    // THEN the dialog closes without creating a contact
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  test('should reopen with a fresh, empty form after being closed and re-triggered', async () => {
    // GIVEN the dialog was opened, partially filled, then closed via Escape
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')
    await user.click(screen.getByRole('button', { name: /nuevo contacto/i }))
    await screen.findByRole('dialog')
    await user.type(screen.getByLabelText(/^nombre$/i), 'Texto Temporal')
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // WHEN the user reopens "Nuevo contacto"
    await user.click(screen.getByRole('button', { name: /nuevo contacto/i }))
    await screen.findByRole('dialog')

    // THEN the Nombre field is empty again (fresh form instance, no stale state)
    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('')
  })
})
