import { describe, test, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CLIENTE_BY_ID_ENDPOINT, clienteNotFoundProblemDetails } from '@/test/msw/handlers'
import { createCliente } from '@/test/factories/cliente.factory'
import { ClienteDetailView } from './ClienteDetailView'

// RED PHASE: ClienteDetailView.tsx and useCliente do not exist yet
// (Story 2.2, Tasks 2-3). These tests define the expected detail-view
// behavior for AC #1, #2, #3, #4.
//
// Network-first: every test registers `server.use(...)` overrides BEFORE
// calling `renderWithRouter` (which triggers the `useCliente(clienteId)`
// fetch on mount), per network-first.md.

function renderDetail(clienteId?: string) {
  return renderWithRouter(<ClienteDetailView clienteId={clienteId} />, {
    initialPath: clienteId ? `/clientes/${clienteId}` : '/clientes',
    withQueryClient: true,
  })
}

describe('ClienteDetailView', () => {
  describe('AC #1/#2 - success state renders Nombre, NIT/RUC, Teléfono, Ciudad', () => {
    test('should display the Nombre label and value', async () => {
      // GIVEN: the backend returns a known client for the given id
      const cliente = createCliente({ nombre: 'Comercializadora Andina SAS' })
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))

      // WHEN: the detail view renders for that clienteId
      renderDetail(cliente.id)

      // THEN: the Nombre value is visible
      expect(await screen.findByText('Comercializadora Andina SAS')).toBeInTheDocument()
    })

    test('should display the NIT/RUC label and value', async () => {
      // GIVEN: the backend returns a known client
      const cliente = createCliente({ nit: '900123456' })
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(cliente.id)

      // THEN: the NIT/RUC value is visible
      expect(await screen.findByText(/900123456/)).toBeInTheDocument()
    })

    test('should display the Teléfono label and value', async () => {
      // GIVEN: the backend returns a known client
      const cliente = createCliente({ telefono: '3001234567' })
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(cliente.id)

      // THEN: the Teléfono value is visible
      expect(await screen.findByText(/3001234567/)).toBeInTheDocument()
    })

    test('should display the Ciudad label and value', async () => {
      // GIVEN: the backend returns a known client
      const cliente = createCliente({ ciudad: 'Bogotá' })
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(cliente.id)

      // THEN: the Ciudad value is visible
      expect(await screen.findByText('Bogotá')).toBeInTheDocument()
    })

    test('should render field labels in Spanish', async () => {
      // GIVEN: the backend returns a known client
      const cliente = createCliente()
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(cliente.id)
      await screen.findByTestId('cliente-detail-panel')

      // THEN: the Spanish field labels are present
      expect(screen.getByText(/^Nombre$/i)).toBeInTheDocument()
      expect(screen.getByText(/NIT\/RUC/i)).toBeInTheDocument()
      expect(screen.getByText(/Tel[ée]fono/i)).toBeInTheDocument()
      expect(screen.getByText(/^Ciudad$/i)).toBeInTheDocument()
    })

    test('should render the detail panel inside a data-testid="cliente-detail-panel" container', async () => {
      // GIVEN: the backend returns a known client
      const cliente = createCliente()
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(cliente.id)

      // THEN: the detail panel container is present
      expect(await screen.findByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })

  describe('AC #1/#2 - loading state', () => {
    test('should render skeleton placeholders while useCliente is loading', () => {
      // GIVEN: the backend request for the client has not resolved yet
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return HttpResponse.json(createCliente(), { status: 200 })
        }),
      )

      // WHEN: the detail view first renders
      renderDetail(createCliente().id)

      // THEN: a skeleton loading placeholder is shown immediately (react-loading-skeleton)
      expect(screen.getByTestId('cliente-detail-loading')).toBeInTheDocument()
    })
  })

  describe('AC #3 - graceful not-found state when clienteId does not exist', () => {
    test('should render a not-found message when the query resolves with a 404', async () => {
      // GIVEN: the backend returns 404 Problem Details for a non-existent clienteId
      const nonExistentId = '00000000-0000-0000-0000-000000000000'
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, () =>
          HttpResponse.json(clienteNotFoundProblemDetails, { status: 404 }),
        ),
      )

      // WHEN: the detail view renders for that id
      renderDetail(nonExistentId)

      // THEN: a graceful not-found block renders
      expect(await screen.findByTestId('cliente-not-found')).toBeInTheDocument()
    })

    test('should NOT render raw error text or technical details on 404 (NFR6)', async () => {
      // GIVEN: the backend returns a 404 with a Problem Details body
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, () =>
          HttpResponse.json(clienteNotFoundProblemDetails, { status: 404 }),
        ),
      )

      // WHEN: the detail view renders
      renderDetail('00000000-0000-0000-0000-000000000000')
      await screen.findByTestId('cliente-not-found')

      // THEN: no raw Problem Details fields (type/title/status keys) leak into the DOM
      expect(screen.queryByText(/rfc7231|ProblemDetails/i)).not.toBeInTheDocument()
    })

    test('should NOT render the field labels (Nombre/NIT/Teléfono/Ciudad) in the not-found state', async () => {
      // GIVEN: a 404 response
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, () =>
          HttpResponse.json(clienteNotFoundProblemDetails, { status: 404 }),
        ),
      )

      // WHEN: the detail view renders
      renderDetail('00000000-0000-0000-0000-000000000000')
      await screen.findByTestId('cliente-not-found')

      // THEN: the success-state field labels are absent — this is a distinct block
      expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
    })
  })

  describe('AC #4 - empty/default state when no client is selected', () => {
    test('should render a "no client selected" guidance message when clienteId is undefined', () => {
      // GIVEN: the list is displayed and no client has been clicked
      // WHEN: the detail view renders without a clienteId
      renderDetail(undefined)

      // THEN: an empty/default state renders instead of a loading/detail/not-found block
      expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument()
    })

    test('should show Spanish guidance copy in the empty/default state', () => {
      // GIVEN: no clienteId is present
      // WHEN: the detail view renders
      renderDetail(undefined)

      // THEN: the guidance text tells the user to select a client, in Spanish
      expect(screen.getByText(/selecciona(r)? un cliente/i)).toBeInTheDocument()
    })

    test('should NOT trigger a fetch when clienteId is undefined (useCliente enabled: !!id)', () => {
      // GIVEN: a request spy on the by-id endpoint
      let requestCount = 0
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createCliente(), { status: 200 })
        }),
      )

      // WHEN: the detail view renders without a clienteId
      renderDetail(undefined)

      // THEN: no request was made for client-by-id data
      expect(requestCount).toBe(0)
    })
  })

  // --- Story 2.4: "Editar" trigger (AC #1, TC-E2-P1-08) -----------------------
  //
  // RED PHASE: `ClienteDetailView.tsx` has no "Editar" button yet (Story 2.4,
  // Task 5). These tests define the expected contract: an "Editar" button is
  // rendered only in the success (loaded) branch, and clicking it opens the
  // edit form pre-filled with the already-loaded client data (no extra fetch).

  describe('AC #1 - "Editar" trigger opens the edit form pre-filled', () => {
    test('should render an "Editar" button when a client is successfully loaded', async () => {
      // GIVEN: the backend returns a known client
      const cliente = createCliente()
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))

      // WHEN: the detail view renders and the client loads
      renderDetail(cliente.id)
      await screen.findByTestId('cliente-detail-panel')

      // THEN: an "Editar" button is present
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    })

    test('should NOT render an "Editar" button while the client is still loading', () => {
      // GIVEN: the backend request has not resolved yet
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return HttpResponse.json(createCliente(), { status: 200 })
        }),
      )

      // WHEN: the detail view first renders
      renderDetail(createCliente().id)

      // THEN: no "Editar" button is rendered yet (only in the loaded success branch)
      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    })

    test('should NOT render an "Editar" button in the not-found state', async () => {
      // GIVEN: the backend returns a 404
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, () =>
          HttpResponse.json(clienteNotFoundProblemDetails, { status: 404 }),
        ),
      )

      // WHEN: the detail view renders for a non-existent id
      renderDetail('00000000-0000-0000-0000-000000000000')
      await screen.findByTestId('cliente-not-found')

      // THEN: no "Editar" button is present
      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    })

    test('should open the edit form when "Editar" is clicked', async () => {
      // GIVEN: a loaded client detail view
      const cliente = createCliente()
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))
      const user = userEvent.setup()
      renderDetail(cliente.id)
      await screen.findByTestId('cliente-detail-panel')

      // WHEN: the user clicks "Editar"
      await user.click(screen.getByRole('button', { name: /editar/i }))

      // THEN: the edit form dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    test('should pre-fill the edit form\'s Nombre field with the already-loaded value (no extra fetch)', async () => {
      // GIVEN: a loaded client detail view
      const cliente = createCliente({ nombre: 'Comercial Rio Grande SAS' })
      let getByIdCallCount = 0
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, () => {
          getByIdCallCount += 1
          return HttpResponse.json(cliente, { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderDetail(cliente.id)
      await screen.findByTestId('cliente-detail-panel')
      const callsBeforeEdit = getByIdCallCount

      // WHEN: the user clicks "Editar"
      await user.click(screen.getByRole('button', { name: /editar/i }))

      // THEN: the form is pre-filled from the already-loaded data — no
      // additional GET /api/v1/clientes/{id} request is fired
      expect(await screen.findByLabelText(/^nombre$/i)).toHaveValue('Comercial Rio Grande SAS')
      expect(getByIdCallCount).toBe(callsBeforeEdit)
    })

    // --- Edge cases (testarch-automate expansion) ---------------------------

    test('should close the edit dialog after a successful save (AC #2)', async () => {
      // GIVEN: a loaded client detail view with the edit dialog open
      const cliente = createCliente()
      server.use(
        http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })),
        http.put(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })),
      )
      const user = userEvent.setup()
      renderDetail(cliente.id)
      await screen.findByTestId('cliente-detail-panel')
      await user.click(screen.getByRole('button', { name: /editar/i }))
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

      // WHEN: the user submits the form and the update succeeds
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN: the dialog closes (onSuccess collapses isEditDialogOpen)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    test('should discard unsaved edits and show fresh data when reopening "Editar" after Cancelar (AC #6)', async () => {
      // GIVEN: a loaded client detail view; the user opens Editar, types a
      // change, then cancels without saving
      const cliente = createCliente({ nombre: 'Nombre Original' })
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))
      const user = userEvent.setup()
      renderDetail(cliente.id)
      await screen.findByTestId('cliente-detail-panel')
      await user.click(screen.getByRole('button', { name: /editar/i }))
      const nombreInput = await screen.findByLabelText(/^nombre$/i)
      await user.clear(nombreInput)
      await user.type(nombreInput, 'Borrador Sin Guardar')
      await user.click(screen.getByRole('button', { name: /cancelar/i }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

      // WHEN: the user reopens "Editar"
      await user.click(screen.getByRole('button', { name: /editar/i }))

      // THEN: the form is re-mounted with the original (unmodified) data —
      // the discarded draft does not leak into the reopened form
      expect(await screen.findByLabelText(/^nombre$/i)).toHaveValue('Nombre Original')
    })

    test('should keep the detail panel showing the ORIGINAL values while the edit dialog is still open and unsaved', async () => {
      // GIVEN: a loaded client detail view with the edit dialog open and a
      // field changed but not yet submitted
      const cliente = createCliente({ ciudad: 'Bogotá' })
      server.use(http.get(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json(cliente, { status: 200 })))
      const user = userEvent.setup()
      renderDetail(cliente.id)
      await screen.findByTestId('cliente-detail-panel')
      await user.click(screen.getByRole('button', { name: /editar/i }))
      const ciudadInput = await screen.findByLabelText(/^ciudad$/i)
      await user.clear(ciudadInput)
      await user.type(ciudadInput, 'Cali')

      // WHEN/THEN: the detail panel behind the dialog still shows the
      // original persisted value — no premature/local mutation (AC #6, R8)
      expect(screen.getByText('Bogotá')).toBeInTheDocument()
    })
  })
})
