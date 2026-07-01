import { describe, test, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CLIENTES_ENDPOINT } from '@/test/msw/handlers'
import { createCliente, createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

// RED PHASE: ClienteListView.tsx, useClientes, EmptyState, ErrorPanel and
// ClientListItem do not exist yet (Story 2.1, Tasks 3-4). These tests define
// the expected list/search/empty/error behavior for AC #1-#5.
//
// Network-first: every test registers `server.use(...)` overrides BEFORE
// calling `renderWithRouter` (which triggers the `useClientes()` fetch on
// mount), per network-first.md.

function renderList() {
  return renderWithRouter(<ClienteListView />, { initialPath: '/clientes', withQueryClient: true })
}

describe('ClienteListView', () => {
  describe('AC #1 - list panel shows all clients with Nombre and NIT/RUC', () => {
    test('should render the scrollable list panel with a list item per client returned by the API', async () => {
      // GIVEN: the backend returns 3 clients
      const clientes = createClientes(3)
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))

      // WHEN: the user navigates to /clientes and ClienteListView renders
      renderList()

      // THEN: the list panel shows exactly one row per client
      const items = await screen.findAllByTestId('cliente-list-item')
      expect(items).toHaveLength(3)
    })

    test('should display both Nombre and NIT/RUC for each list item (TC-E2-P2-04)', async () => {
      // GIVEN: the backend returns a single known client
      const cliente = createCliente({ nombre: 'Comercializadora Andina SAS', nit: '900123456' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([cliente], { status: 200 })))

      // WHEN: the list renders
      renderList()
      const item = await screen.findByTestId('cliente-list-item')

      // THEN: both fields are visible without further interaction
      expect(within(item).getByText('Comercializadora Andina SAS')).toBeInTheDocument()
      expect(within(item).getByText(/900123456/)).toBeInTheDocument()
    })

    test('should render the list panel container with the 280px .panel-list class per UX spec', async () => {
      // GIVEN: the backend returns clients
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(createClientes(2), { status: 200 })))

      // WHEN: the list renders
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // THEN: the panel-list layout class is present (280px fixed width per UX spec)
      expect(screen.getByTestId('clientes-list-panel')).toHaveClass('panel-list')
    })
  })

  describe('AC #2 - real-time client-side search by Nombre or NIT/RUC', () => {
    test('should filter the list to only clients whose nombre matches the typed search term', async () => {
      // GIVEN: the list is loaded with distinctly-named clients
      const target = createCliente({ nombre: 'Distribuidora del Pacífico' })
      const other = createCliente({ nombre: 'Suministros del Norte' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target, other], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user types a substring of only the target client's nombre
      await user.type(screen.getByTestId('cliente-search-input'), 'Pacífico')

      // THEN: only the matching client remains in the list
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      })
      expect(screen.getByText('Distribuidora del Pacífico')).toBeInTheDocument()
    })

    test('should filter the list to only clients whose NIT/RUC matches the typed search term', async () => {
      // GIVEN: the list is loaded with distinct NITs
      const target = createCliente({ nit: '830199999' })
      const other = createCliente({ nit: '900111222' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target, other], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user types a substring of only the target client's NIT
      await user.type(screen.getByTestId('cliente-search-input'), '830199')

      // THEN: only the matching client remains
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      })
    })

    test('should match case-insensitively', async () => {
      // GIVEN: a client named with mixed case
      const target = createCliente({ nombre: 'ACME Industrial' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user types the search term in a different case
      await user.type(screen.getByTestId('cliente-search-input'), 'acme industrial')

      // THEN: the client still matches (case-insensitive substring match)
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      })
    })

    test('should not trigger a new network request while filtering (client-side only)', async () => {
      // GIVEN: the list is loaded and a request spy is attached
      let requestCount = 0
      server.use(
        http.get(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createClientes(4), { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')
      const countAfterInitialLoad = requestCount

      // WHEN: the user types into the search field
      await user.type(screen.getByTestId('cliente-search-input'), 'xyz')

      // THEN: no additional fetch fired for the ['clientes'] query — filtering is in-memory
      await waitFor(() => {
        expect(requestCount).toBe(countAfterInitialLoad)
      })
    })
  })

  describe('AC #3 - EmptyState (no-clients variant) when dataset is empty', () => {
    test('should render the no-clients EmptyState when the API returns an empty array', async () => {
      // GIVEN: the backend has zero clients
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([], { status: 200 })))

      // WHEN: the user navigates to /clientes
      renderList()

      // THEN: the no-clients EmptyState renders with guidance to create the first client
      const emptyState = await screen.findByTestId('empty-state-no-clients')
      expect(emptyState).toBeInTheDocument()
      expect(within(emptyState).getByText(/crea(r)? (tu|el) primer cliente/i)).toBeInTheDocument()
    })

    test('should NOT render any list item rows when the dataset is empty', async () => {
      // GIVEN: zero clients
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([], { status: 200 })))

      // WHEN: the view renders
      renderList()
      await screen.findByTestId('empty-state-no-clients')

      // THEN: no list-item rows exist
      expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
    })
  })

  describe('AC #4 - zero search results shows a distinct search-empty state', () => {
    test('should show the search-empty state (not no-clients) when the search matches nothing', async () => {
      // GIVEN: clients are loaded (dataset is non-empty)
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(createClientes(5), { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user types a search term matching no client
      await user.type(screen.getByTestId('cliente-search-input'), 'zzzzz-no-match-zzzzz')

      // THEN: the search-empty state renders, structurally distinct from no-clients
      const searchEmpty = await screen.findByTestId('empty-state-search-empty')
      expect(searchEmpty).toBeInTheDocument()
      expect(screen.queryByTestId('empty-state-no-clients')).not.toBeInTheDocument()
    })

    test('should retain the typed search value when zero results are found', async () => {
      // GIVEN: clients are loaded
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(createClientes(3), { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user types a non-matching search term
      await user.type(screen.getByTestId('cliente-search-input'), 'no-existe-este-cliente')

      // THEN: the search input still shows what the user typed
      await screen.findByTestId('empty-state-search-empty')
      expect(screen.getByTestId('cliente-search-input')).toHaveValue('no-existe-este-cliente')
    })

    test('should keep the search input visible while the search-empty state is shown', async () => {
      // GIVEN: clients are loaded
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(createClientes(3), { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: search yields zero results
      await user.type(screen.getByTestId('cliente-search-input'), 'sin-coincidencias')
      await screen.findByTestId('empty-state-search-empty')

      // THEN: the search input remains rendered (not replaced by the empty state)
      expect(screen.getByTestId('cliente-search-input')).toBeVisible()
    })
  })

  describe('AC #5 - ErrorPanel with Reintentar when the backend is unavailable', () => {
    test('should render ErrorPanel instead of the list when the initial fetch fails', async () => {
      // GIVEN: the backend is unavailable
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json({ error: 'unavailable' }, { status: 500 })))

      // WHEN: the user navigates to /clientes
      renderList()

      // THEN: ErrorPanel renders instead of the list
      const errorPanel = await screen.findByTestId('error-panel')
      expect(errorPanel).toBeInTheDocument()
      expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
    })

    test('should show a "Reintentar" button inside the ErrorPanel', async () => {
      // GIVEN: the backend is unavailable
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json({ error: 'unavailable' }, { status: 500 })))

      // WHEN: ErrorPanel renders
      renderList()
      const errorPanel = await screen.findByTestId('error-panel')

      // THEN: a "Reintentar" button is present
      expect(within(errorPanel).getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })

    test('should re-trigger the fetch and render the list when Reintentar succeeds', async () => {
      // GIVEN: the first request fails, but a retry would succeed
      let attempt = 0
      const clientes = createClientes(2)
      server.use(
        http.get(CLIENTES_ENDPOINT, () => {
          attempt += 1
          if (attempt === 1) {
            return HttpResponse.json({ error: 'unavailable' }, { status: 500 })
          }
          return HttpResponse.json(clientes, { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      const errorPanel = await screen.findByTestId('error-panel')

      // WHEN: the user clicks "Reintentar"
      await user.click(within(errorPanel).getByRole('button', { name: /reintentar/i }))

      // THEN: the list renders normally and the error panel is gone
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
      })
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    })

    test('should never render the raw error message text (no technical detail leak)', async () => {
      // GIVEN: the backend fails with a technical error body
      server.use(
        http.get(CLIENTES_ENDPOINT, () =>
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
})
