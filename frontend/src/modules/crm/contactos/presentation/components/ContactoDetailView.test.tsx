import { describe, test, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CONTACTO_BY_ID_ENDPOINT, contactoNotFoundProblemDetails } from '@/test/msw/handlers'
import { createContacto } from '@/test/factories/contacto.factory'
import { ContactoDetailView } from './ContactoDetailView'

// --- Story 3.2: Contact Detail View (AC #1, #2, #3, #4) ---------------------
//
// RED PHASE: `ContactoDetailView.tsx` and `useContacto` do not exist yet
// (Story 3.2, Tasks 2-3). These tests define the expected detail-view
// contract, mirroring `ClienteDetailView.test.tsx`'s structural template
// exactly (same problem: detail view + deep link + not-found), scoped ONLY
// to this story's read-only display (no Editar/Eliminar — those belong to
// Stories 3.4/3.5 and must NOT be tested here).
//
// Network-first: every test registers `server.use(...)` overrides BEFORE
// calling `renderWithRouter` (which triggers the `useContacto(contactoId)`
// fetch on mount), per network-first.md.

function renderDetail(contactoId?: string, listMembership?: 'pending' | 'present' | 'missing') {
  return renderWithRouter(
    <ContactoDetailView contactoId={contactoId} listMembership={listMembership} />,
    {
      initialPath: contactoId ? `/contactos/${contactoId}` : '/contactos',
      withQueryClient: true,
    },
  )
}

describe('ContactoDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #1 - success state renders Nombre, Cargo, Teléfono, Email', () => {
    test('should display the Nombre label and value', async () => {
      // GIVEN: the backend returns a known contact for the given id
      const contacto = createContacto({ nombre: 'Laura Gómez Restrepo' })
      server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

      // WHEN: the detail view renders for that contactoId
      renderDetail(contacto.id)

      // THEN: the Nombre value is visible
      expect(await screen.findByText('Laura Gómez Restrepo')).toBeInTheDocument()
    })

    test('should display the Cargo label and value', async () => {
      // GIVEN: the backend returns a known contact
      const contacto = createContacto({ cargo: 'Directora Comercial' })
      server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(contacto.id)

      // THEN: the Cargo value is visible
      expect(await screen.findByText('Directora Comercial')).toBeInTheDocument()
    })

    test('should display the Teléfono label and value', async () => {
      // GIVEN: the backend returns a known contact
      const contacto = createContacto({ telefono: '3101234567' })
      server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(contacto.id)

      // THEN: the Teléfono value is visible
      expect(await screen.findByText(/3101234567/)).toBeInTheDocument()
    })

    test('should display the Email label and value', async () => {
      // GIVEN: the backend returns a known contact
      const contacto = createContacto({ email: 'laura.gomez@ejemplo.co' })
      server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(contacto.id)

      // THEN: the Email value is visible
      expect(await screen.findByText('laura.gomez@ejemplo.co')).toBeInTheDocument()
    })

    test('should render field labels in Spanish', async () => {
      // GIVEN: the backend returns a known contact
      const contacto = createContacto()
      server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(contacto.id)
      await screen.findByTestId('contacto-detail-panel')

      // THEN: the Spanish field labels are present
      expect(screen.getByText(/^Nombre$/i)).toBeInTheDocument()
      expect(screen.getByText(/^Cargo$/i)).toBeInTheDocument()
      expect(screen.getByText(/Tel[ée]fono/i)).toBeInTheDocument()
      expect(screen.getByText(/^Email$/i)).toBeInTheDocument()
    })

    test('should render the detail panel inside a data-testid="contacto-detail-panel" container', async () => {
      // GIVEN: the backend returns a known contact
      const contacto = createContacto()
      server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(contacto.id)

      // THEN: the detail panel container is present
      expect(await screen.findByTestId('contacto-detail-panel')).toBeInTheDocument()
    })

    test('should NOT render "Editar" or "Eliminar" actions (out of scope for this story)', async () => {
      // GIVEN: the backend returns a known contact
      const contacto = createContacto()
      server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

      // WHEN: the detail view renders
      renderDetail(contacto.id)
      await screen.findByTestId('contacto-detail-panel')

      // THEN: no Editar/Eliminar buttons exist yet — those belong to Stories 3.4/3.5
      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
    })
  })

  describe('AC #1/#2 - loading state', () => {
    test('should render skeleton placeholders while useContacto is loading', () => {
      // GIVEN: the backend request for the contact has not resolved yet
      server.use(
        http.get(CONTACTO_BY_ID_ENDPOINT, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return HttpResponse.json(createContacto(), { status: 200 })
        }),
      )

      // WHEN: the detail view first renders
      renderDetail(createContacto().id)

      // THEN: a skeleton loading placeholder is shown immediately (react-loading-skeleton)
      expect(screen.getByTestId('contacto-detail-loading')).toBeInTheDocument()
    })
  })

  describe('AC #3 - graceful not-found state when contactoId does not exist', () => {
    test('should render a not-found message when the query resolves with a 404', async () => {
      // GIVEN: the backend returns 404 Problem Details for a non-existent contactoId
      const nonExistentId = '00000000-0000-0000-0000-000000000000'
      server.use(
        http.get(CONTACTO_BY_ID_ENDPOINT, () =>
          HttpResponse.json(contactoNotFoundProblemDetails, { status: 404 }),
        ),
      )

      // WHEN: the detail view renders for that id
      renderDetail(nonExistentId)

      // THEN: a graceful not-found block renders
      expect(await screen.findByTestId('contacto-not-found')).toBeInTheDocument()
    })

    test('should NOT render raw error text or technical details on 404 (NFR6)', async () => {
      // GIVEN: the backend returns a 404 with a Problem Details body
      server.use(
        http.get(CONTACTO_BY_ID_ENDPOINT, () =>
          HttpResponse.json(contactoNotFoundProblemDetails, { status: 404 }),
        ),
      )

      // WHEN: the detail view renders
      renderDetail('00000000-0000-0000-0000-000000000000')
      await screen.findByTestId('contacto-not-found')

      // THEN: no raw Problem Details fields (type/title/status keys) leak into the DOM
      expect(screen.queryByText(/rfc7231|ProblemDetails/i)).not.toBeInTheDocument()
    })

    test('should NOT render the field labels (Nombre/Cargo/Teléfono/Email) in the not-found state', async () => {
      // GIVEN: a 404 response
      server.use(
        http.get(CONTACTO_BY_ID_ENDPOINT, () =>
          HttpResponse.json(contactoNotFoundProblemDetails, { status: 404 }),
        ),
      )

      // WHEN: the detail view renders
      renderDetail('00000000-0000-0000-0000-000000000000')
      await screen.findByTestId('contacto-not-found')

      // THEN: the success-state field labels are absent — this is a distinct block
      expect(screen.queryByTestId('contacto-detail-panel')).not.toBeInTheDocument()
    })

    test('should render the not-found block immediately (no by-id request) when listMembership is "missing"', async () => {
      // GIVEN: a request spy on the by-id endpoint and a route that already
      // knows (via the sibling list) that this contactoId does not exist —
      // the `listMembership` prop pattern (R5 mitigation, avoids a doomed
      // 404 request that would otherwise log a browser-level console error)
      let requestCount = 0
      server.use(
        http.get(CONTACTO_BY_ID_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(contactoNotFoundProblemDetails, { status: 404 })
        }),
      )

      // WHEN: the detail view renders with listMembership="missing"
      renderDetail('00000000-0000-0000-0000-000000000000', 'missing')

      // THEN: the not-found block renders and zero by-id requests were made
      expect(await screen.findByTestId('contacto-not-found')).toBeInTheDocument()
      expect(requestCount).toBe(0)
    })

    test('should show the loading skeleton (not an error) while listMembership is "pending"', () => {
      // GIVEN: the sibling list has not yet resolved whether contactoId exists
      let requestCount = 0
      server.use(
        http.get(CONTACTO_BY_ID_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createContacto(), { status: 200 })
        }),
      )

      // WHEN: the detail view renders with listMembership="pending"
      renderDetail('some-contacto-id', 'pending')

      // THEN: the skeleton renders and the by-id request is held off
      expect(screen.getByTestId('contacto-detail-loading')).toBeInTheDocument()
      expect(requestCount).toBe(0)
    })
  })

  describe('AC #4 - empty/default state when no contact is selected', () => {
    test('should render a "no contact selected" guidance message when contactoId is undefined', () => {
      // GIVEN: the list is displayed and no contact has been clicked
      // WHEN: the detail view renders without a contactoId
      renderDetail(undefined)

      // THEN: an empty/default state renders instead of a loading/detail/not-found block
      expect(screen.getByTestId('contacto-detail-empty')).toBeInTheDocument()
    })

    test('should show Spanish guidance copy in the empty/default state', () => {
      // GIVEN: no contactoId is present
      // WHEN: the detail view renders
      renderDetail(undefined)

      // THEN: the guidance text tells the user to select a contact, in Spanish
      expect(screen.getByText(/selecciona(r)? un contacto/i)).toBeInTheDocument()
    })

    test('should NOT trigger a fetch when contactoId is undefined (useContacto enabled: !!id)', () => {
      // GIVEN: a request spy on the by-id endpoint
      let requestCount = 0
      server.use(
        http.get(CONTACTO_BY_ID_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createContacto(), { status: 200 })
        }),
      )

      // WHEN: the detail view renders without a contactoId
      renderDetail(undefined)

      // THEN: no request was made for contact-by-id data
      expect(requestCount).toBe(0)
    })
  })
})
