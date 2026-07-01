import { describe, test, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CONTACTOS_ENDPOINT } from '@/test/msw/handlers'
import { createContacto, createContactos } from '@/test/factories/contacto.factory'
import { ContactoListView } from './ContactoListView'

// RED PHASE: ContactoListView.tsx, useContactos, contactoApiRepository, and
// ContactListItem do not exist yet (Story 3.1, Tasks 4-5). These tests define
// the expected list/search/empty/error behavior for AC #1-#5.
//
// Network-first: every test registers `server.use(...)` overrides BEFORE
// calling `renderWithRouter` (which triggers the `useContactos()` fetch on
// mount), per network-first.md.

function renderList() {
  return renderWithRouter(<ContactoListView />, { initialPath: '/contactos', withQueryClient: true })
}

describe('ContactoListView', () => {
  describe('AC #1 - list panel shows all contacts with Nombre, Cargo and Email', () => {
    test('should render one list item per contact returned by the API', async () => {
      // GIVEN: the backend returns 3 contacts
      const contactos = createContactos(3)
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))

      // WHEN: the user navigates to /contactos and ContactoListView renders
      renderList()

      // THEN: the list panel shows exactly one row per contact
      const items = await screen.findAllByTestId('contacto-list-item')
      expect(items).toHaveLength(3)
    })

    test('should display Nombre, Cargo and Email for each list item (TC-E3-P2-05)', async () => {
      // GIVEN: the backend returns a single known contact
      const contacto = createContacto({
        nombre: 'Laura Gómez',
        cargo: 'Gerente Comercial',
        email: 'laura.gomez@example.com',
      })
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([contacto], { status: 200 })))

      // WHEN: the list renders
      renderList()
      const item = await screen.findByTestId('contacto-list-item')

      // THEN: all three fields are visible without further interaction
      expect(within(item).getByText('Laura Gómez')).toBeInTheDocument()
      expect(within(item).getByText('Gerente Comercial')).toBeInTheDocument()
      expect(within(item).getByText('laura.gomez@example.com')).toBeInTheDocument()
    })
  })

  describe('AC #2 - real-time client-side search by Nombre OR Email (R6: independent fields)', () => {
    test('should filter the list to only contacts whose nombre matches the typed search term', async () => {
      // GIVEN: the list is loaded with distinctly-named contacts
      const target = createContacto({ nombre: 'Distribuidora del Pacífico' })
      const other = createContacto({ nombre: 'Suministros del Norte' })
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target, other], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('contacto-list-item')

      // WHEN: the user types a substring of only the target contact's nombre
      await user.type(screen.getByTestId('contacto-search-input'), 'Pacífico')

      // THEN: only the matching contact remains in the list
      await waitFor(() => {
        expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
      })
      expect(screen.getByText('Distribuidora del Pacífico')).toBeInTheDocument()
    })

    test('should filter the list to only contacts whose EMAIL matches the typed search term, independent of nombre (R6)', async () => {
      // GIVEN: a contact whose EMAIL contains the search term but whose
      // NOMBRE does not — this is the exact regression R6 targets: a
      // Nombre-only filter would silently fail this test
      const target = createContacto({ nombre: 'Juan Pérez', email: 'unico.correo@dominio-especial.co' })
      const other = createContacto({ nombre: 'María López', email: 'otro@ejemplo.com' })
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target, other], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('contacto-list-item')

      // WHEN: the user types a substring that exists ONLY in the target's email
      await user.type(screen.getByTestId('contacto-search-input'), 'dominio-especial.co')

      // THEN: only the matching contact remains, found via its Email field
      await waitFor(() => {
        expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
      })
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    test('should match case-insensitively', async () => {
      // GIVEN: a contact named with mixed case
      const target = createContacto({ nombre: 'ACME Industrial' })
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('contacto-list-item')

      // WHEN: the user types the search term in a different case
      await user.type(screen.getByTestId('contacto-search-input'), 'acme industrial')

      // THEN: the contact still matches (case-insensitive substring match)
      await waitFor(() => {
        expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
      })
    })

    test('should not trigger a new network request while filtering (client-side only, TC-E3-P1-01)', async () => {
      // GIVEN: the list is loaded and a request spy is attached
      let requestCount = 0
      server.use(
        http.get(CONTACTOS_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createContactos(4), { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('contacto-list-item')
      const countAfterInitialLoad = requestCount

      // WHEN: the user types into the search field
      await user.type(screen.getByTestId('contacto-search-input'), 'xyz')

      // THEN: no additional fetch fired for the ['contactos'] query — filtering is in-memory
      await waitFor(() => {
        expect(requestCount).toBe(countAfterInitialLoad)
      })
    })
  })

  describe('AC #3 - EmptyState (no-contacts variant) when dataset is empty', () => {
    test('should render the no-contacts EmptyState when the API returns an empty array', async () => {
      // GIVEN: the backend has zero contacts
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([], { status: 200 })))

      // WHEN: the user navigates to /contactos
      renderList()

      // THEN: the no-contacts EmptyState renders with guidance to create the first contact
      const emptyState = await screen.findByTestId('empty-state-no-contacts')
      expect(emptyState).toBeInTheDocument()
    })

    test('should NOT render any list item rows when the dataset is empty', async () => {
      // GIVEN: zero contacts
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([], { status: 200 })))

      // WHEN: the view renders
      renderList()
      await screen.findByTestId('empty-state-no-contacts')

      // THEN: no list-item rows exist
      expect(screen.queryByTestId('contacto-list-item')).not.toBeInTheDocument()
    })
  })

  describe('AC #4 - zero search results shows a distinct search-empty state (TC-E3-P1-04)', () => {
    test('should show the search-empty state (not no-contacts) when the search matches nothing', async () => {
      // GIVEN: contacts are loaded (dataset is non-empty)
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(createContactos(5), { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('contacto-list-item')

      // WHEN: the user types a search term matching no contact
      await user.type(screen.getByTestId('contacto-search-input'), 'zzzzz-no-match-zzzzz')

      // THEN: the search-empty state renders, structurally distinct from no-contacts
      const searchEmpty = await screen.findByTestId('empty-state-search-empty')
      expect(searchEmpty).toBeInTheDocument()
      expect(screen.queryByTestId('empty-state-no-contacts')).not.toBeInTheDocument()
    })

    test('should retain the typed search value when zero results are found', async () => {
      // GIVEN: contacts are loaded
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(createContactos(3), { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('contacto-list-item')

      // WHEN: the user types a non-matching search term
      await user.type(screen.getByTestId('contacto-search-input'), 'no-existe-este-contacto')

      // THEN: the search input still shows what the user typed
      await screen.findByTestId('empty-state-search-empty')
      expect(screen.getByTestId('contacto-search-input')).toHaveValue('no-existe-este-contacto')
    })

    test('should keep the search input visible while the search-empty state is shown', async () => {
      // GIVEN: contacts are loaded
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(createContactos(3), { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('contacto-list-item')

      // WHEN: search yields zero results
      await user.type(screen.getByTestId('contacto-search-input'), 'sin-coincidencias')
      await screen.findByTestId('empty-state-search-empty')

      // THEN: the search input remains rendered (not replaced by the empty state)
      expect(screen.getByTestId('contacto-search-input')).toBeVisible()
    })
  })

  describe('AC #5 - ErrorPanel with Reintentar when the backend is unavailable (TC-E3-P1-05)', () => {
    test('should render ErrorPanel instead of the list when the initial fetch fails', async () => {
      // GIVEN: the backend is unavailable
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json({ error: 'unavailable' }, { status: 500 })))

      // WHEN: the user navigates to /contactos
      renderList()

      // THEN: ErrorPanel renders instead of the list
      const errorPanel = await screen.findByTestId('error-panel')
      expect(errorPanel).toBeInTheDocument()
      expect(screen.queryByTestId('contacto-list-item')).not.toBeInTheDocument()
    })

    test('should show a "Reintentar" button inside the ErrorPanel', async () => {
      // GIVEN: the backend is unavailable
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json({ error: 'unavailable' }, { status: 500 })))

      // WHEN: ErrorPanel renders
      renderList()
      const errorPanel = await screen.findByTestId('error-panel')

      // THEN: a "Reintentar" button is present
      expect(within(errorPanel).getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })

    test('should re-trigger the fetch and render the list when Reintentar succeeds', async () => {
      // GIVEN: the first request fails, but a retry would succeed
      let attempt = 0
      const contactos = createContactos(2)
      server.use(
        http.get(CONTACTOS_ENDPOINT, () => {
          attempt += 1
          if (attempt === 1) {
            return HttpResponse.json({ error: 'unavailable' }, { status: 500 })
          }
          return HttpResponse.json(contactos, { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      const errorPanel = await screen.findByTestId('error-panel')

      // WHEN: the user clicks "Reintentar"
      await user.click(within(errorPanel).getByRole('button', { name: /reintentar/i }))

      // THEN: the list renders normally and the error panel is gone
      await waitFor(() => {
        expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2)
      })
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    })

    test('should never render the raw error message text (no technical detail leak)', async () => {
      // GIVEN: the backend fails with a technical error body
      server.use(
        http.get(CONTACTOS_ENDPOINT, () =>
          HttpResponse.json({ message: 'Npgsql.PostgresException: connection refused' }, { status: 500 }),
        ),
      )

      // WHEN: ErrorPanel renders
      renderList()
      await screen.findByTestId('error-panel')

      // THEN: the raw backend error text is never displayed to the user
      expect(screen.queryByText(/Npgsql|PostgresException/i)).not.toBeInTheDocument()
    })
  })

  // --- Story 3.2: wiring ContactListItem's onClick to navigation -------------
  //
  // RED PHASE: `ContactoListView.tsx` renders `<ContactListItem>` without the
  // `onClick`/`selected` props wired yet (Story 3.1 left them inert; Story
  // 3.2, Task 4 activates them). Mirrors `ClienteListView`'s equivalent
  // wiring — clicking a row navigates to `/contactos/$contactoId` via
  // TanStack Router's `useNavigate`, and `selected` is derived from the
  // current route's `$contactoId` param (scoped match, NOT the loose
  // `pathname.match(/^\/contactos\/(.+)$/)` regex Epic 2 review flagged as a
  // future-sibling-route hazard — see Dev Notes/Task 4).

  describe('AC #1 - selecting a contact navigates to /contactos/:contactoId', () => {
    test('should mark the ContactListItem matching the current $contactoId route param as selected', async () => {
      // GIVEN: the list is loaded and the current route is /contactos/:contactoId
      // for one of the contacts (mirrors ClienteListView's `selected` derivation)
      const contactos = createContactos(2)
      const [target] = contactos
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))

      // WHEN: the list renders while the route is at that contact's detail URL
      renderWithRouter(<ContactoListView />, {
        initialPath: `/contactos/${target.id}`,
        withQueryClient: true,
      })
      const items = await screen.findAllByTestId('contacto-list-item')

      // THEN: exactly one item is marked aria-selected="true" — the one
      // matching the route's contactoId, scoped to the actual $contactoId
      // route match (not a loose regex that would also match future sibling
      // static routes under /contactos/)
      const selectedItems = items.filter((item) => item.getAttribute('aria-selected') === 'true')
      expect(selectedItems).toHaveLength(1)
      expect(within(selectedItems[0]).getByText(target.nombre)).toBeInTheDocument()
    })

    test('should NOT mark any item as selected when on the bare /contactos route (no contactoId)', async () => {
      // GIVEN: the list is loaded with contacts
      const contactos = createContactos(2)
      server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))

      // WHEN: the list renders at the bare /contactos route (AC #4 scenario)
      renderList()
      const items = await screen.findAllByTestId('contacto-list-item')

      // THEN: no item is marked as selected
      const selectedItems = items.filter((item) => item.getAttribute('aria-selected') === 'true')
      expect(selectedItems).toHaveLength(0)
    })
  })
})
