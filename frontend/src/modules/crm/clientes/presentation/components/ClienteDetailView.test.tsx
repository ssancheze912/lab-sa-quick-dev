import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
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
})
