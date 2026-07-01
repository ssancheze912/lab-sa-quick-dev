import { describe, test, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CLIENTES_ENDPOINT } from '@/test/msw/handlers'
import { createCliente, createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

// RED PHASE: SortControl does not exist yet and ClienteListView.tsx has no
// sort wiring (Story 2.6, Task 2). This file isolates the sort-specific
// acceptance criteria (#1-#6) from the pre-existing list/search suite
// (ClienteListView.test.tsx), per test-quality.md's "isolate new concerns in
// their own file" precedent already used by
// ClienteListView.performance.test.tsx / .edge-cases.test.tsx.
//
// Network-first: every test registers `server.use(...)` overrides BEFORE
// `renderWithRouter` triggers the `useClientes()` fetch on mount.

function renderList() {
  return renderWithRouter(<ClienteListView />, { initialPath: '/clientes', withQueryClient: true })
}

/**
 * Reads the `nombre` of every rendered `cliente-list-item`, in DOM order.
 * `ClientListItem` (Story 2.1) renders `nombre` as the item's first text
 * paragraph without its own `data-testid` — the item's first line of text
 * content is the `nombre` per that component's established markup.
 */
function getRenderedNombres() {
  return screen.getAllByTestId('cliente-list-item').map((item) => {
    const firstLine = within(item).getAllByRole('paragraph')[0]
    return firstLine.textContent
  })
}

async function selectSortOption(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByTestId('sort-control'))
  await user.click(screen.getByRole('option', { name: label }))
}

describe('ClienteListView - Sort (Story 2.6)', () => {
  describe('AC #1 - "Nombre A→Z" sorts ascending by nombre without a new API call', () => {
    test('should reorder the list alphabetically ascending by nombre', async () => {
      // GIVEN: the list is loaded with clients in a non-alphabetical order
      const clientes = [
        createCliente({ nombre: 'Zeta Comercial' }),
        createCliente({ nombre: 'Alfa Distribuciones' }),
        createCliente({ nombre: 'Media Suministros' }),
      ]
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user selects "Nombre A→Z"
      await selectSortOption(user, 'Nombre A→Z')

      // THEN: the list reorders alphabetically ascending by nombre
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual([
          'Alfa Distribuciones',
          'Media Suministros',
          'Zeta Comercial',
        ])
      })
    })

    test('should NOT trigger a new API call when sorting by "Nombre A→Z"', async () => {
      // GIVEN: the list is loaded and a request spy is attached
      let requestCount = 0
      server.use(
        http.get(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createClientes(3), { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')
      const countAfterInitialLoad = requestCount

      // WHEN: the user selects "Nombre A→Z"
      await selectSortOption(user, 'Nombre A→Z')

      // THEN: no additional fetch fired for the ['clientes'] query
      await waitFor(() => {
        expect(screen.getByTestId('sort-control')).toHaveTextContent('Nombre A→Z')
      })
      expect(requestCount).toBe(countAfterInitialLoad)
    })
  })

  describe('AC #2 - "Nombre Z→A" sorts descending by nombre without a new API call', () => {
    test('should reorder the list alphabetically descending by nombre', async () => {
      // GIVEN: the list is loaded with clients in a non-alphabetical order
      const clientes = [
        createCliente({ nombre: 'Alfa Distribuciones' }),
        createCliente({ nombre: 'Zeta Comercial' }),
        createCliente({ nombre: 'Media Suministros' }),
      ]
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user selects "Nombre Z→A"
      await selectSortOption(user, 'Nombre Z→A')

      // THEN: the list reorders alphabetically descending by nombre
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual([
          'Zeta Comercial',
          'Media Suministros',
          'Alfa Distribuciones',
        ])
      })
    })

    test('should NOT trigger a new API call when sorting by "Nombre Z→A"', async () => {
      // GIVEN: the list is loaded and a request spy is attached
      let requestCount = 0
      server.use(
        http.get(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createClientes(3), { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')
      const countAfterInitialLoad = requestCount

      // WHEN: the user selects "Nombre Z→A"
      await selectSortOption(user, 'Nombre Z→A')

      // THEN: no additional fetch fired for the ['clientes'] query
      await waitFor(() => {
        expect(screen.getByTestId('sort-control')).toHaveTextContent('Nombre Z→A')
      })
      expect(requestCount).toBe(countAfterInitialLoad)
    })
  })

  describe('AC #3 - "Más reciente" orders by createdAt descending (newest first)', () => {
    test('should reorder the list with the newest createdAt first', async () => {
      // GIVEN: three clients with distinct, deliberately-shuffled createdAt values
      const oldest = createCliente({ nombre: 'Cliente Antiguo', createdAt: '2024-01-01T00:00:00.000Z' })
      const newest = createCliente({ nombre: 'Cliente Reciente', createdAt: '2024-06-01T00:00:00.000Z' })
      const middle = createCliente({ nombre: 'Cliente Intermedio', createdAt: '2024-03-01T00:00:00.000Z' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([oldest, newest, middle], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user selects "Más reciente" (after first switching away from the default
      // to prove the interaction actively re-sorts, not just reads the initial order)
      await selectSortOption(user, 'Nombre A→Z')
      await waitFor(() => {
        expect(getRenderedNombres()?.[0]).not.toBeNull()
      })
      await selectSortOption(user, 'Más reciente')

      // THEN: the newest client appears first
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual(['Cliente Reciente', 'Cliente Intermedio', 'Cliente Antiguo'])
      })
    })

    test('should NOT trigger a new API call when sorting by "Más reciente"', async () => {
      // GIVEN: the list is loaded (already sorted differently) and a request spy is attached
      let requestCount = 0
      const clientes = createClientes(3)
      server.use(
        http.get(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(clientes, { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')
      await selectSortOption(user, 'Nombre A→Z')
      const countAfterFirstSort = requestCount

      // WHEN: the user selects "Más reciente"
      await selectSortOption(user, 'Más reciente')

      // THEN: no additional fetch fired for the ['clientes'] query
      await waitFor(() => {
        expect(screen.getByTestId('sort-control')).toHaveTextContent('Más reciente')
      })
      expect(requestCount).toBe(countAfterFirstSort)
    })
  })

  describe('AC #4 - "Más antiguo" orders by createdAt ascending (oldest first)', () => {
    test('should reorder the list with the oldest createdAt first', async () => {
      // GIVEN: three clients with distinct, deliberately-shuffled createdAt values
      const oldest = createCliente({ nombre: 'Cliente Antiguo', createdAt: '2024-01-01T00:00:00.000Z' })
      const newest = createCliente({ nombre: 'Cliente Reciente', createdAt: '2024-06-01T00:00:00.000Z' })
      const middle = createCliente({ nombre: 'Cliente Intermedio', createdAt: '2024-03-01T00:00:00.000Z' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([newest, oldest, middle], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user selects "Más antiguo"
      await selectSortOption(user, 'Más antiguo')

      // THEN: the oldest client appears first
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual(['Cliente Antiguo', 'Cliente Intermedio', 'Cliente Reciente'])
      })
    })

    test('should NOT trigger a new API call when sorting by "Más antiguo"', async () => {
      // GIVEN: the list is loaded and a request spy is attached
      let requestCount = 0
      server.use(
        http.get(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(createClientes(3), { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')
      const countAfterInitialLoad = requestCount

      // WHEN: the user selects "Más antiguo"
      await selectSortOption(user, 'Más antiguo')

      // THEN: no additional fetch fired for the ['clientes'] query
      await waitFor(() => {
        expect(screen.getByTestId('sort-control')).toHaveTextContent('Más antiguo')
      })
      expect(requestCount).toBe(countAfterInitialLoad)
    })
  })

  describe('AC #5 - sort applies only to the active search-filtered subset (R5)', () => {
    test('should reorder only the filtered subset, never reintroducing excluded clients', async () => {
      // GIVEN: a search filter has already narrowed the list to two matching clients
      const matchA = createCliente({ nombre: 'Distribuidora Zeta', nit: '111' })
      const matchB = createCliente({ nombre: 'Distribuidora Alfa', nit: '222' })
      const excluded = createCliente({ nombre: 'Suministros del Sur', nit: '333' })
      server.use(
        http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([matchA, matchB, excluded], { status: 200 })),
      )
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')
      await user.type(screen.getByTestId('cliente-search-input'), 'Distribuidora')
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
      })

      // WHEN: the user changes the sort order to "Nombre A→Z"
      await selectSortOption(user, 'Nombre A→Z')

      // THEN: only the two filtered clients are reordered; the excluded one never reappears
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual(['Distribuidora Alfa', 'Distribuidora Zeta'])
      })
      expect(screen.queryByText('Suministros del Sur')).not.toBeInTheDocument()
    })

    test('should retain the typed search input value after changing the sort order', async () => {
      // GIVEN: a search filter has already narrowed the list
      const clientes = createClientes(3, { nombre: 'Comercial Test' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')
      await user.type(screen.getByTestId('cliente-search-input'), 'Comercial')
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
      })

      // WHEN: the user changes the sort order
      await selectSortOption(user, 'Nombre Z→A')

      // THEN: the search input still shows the typed value (not cleared)
      await waitFor(() => {
        expect(screen.getByTestId('sort-control')).toHaveTextContent('Nombre Z→A')
      })
      expect(screen.getByTestId('cliente-search-input')).toHaveValue('Comercial')
    })
  })

  describe('AC #6 - default sort on initial render is "Más reciente"', () => {
    test('should display "Más reciente" as the selected SortControl option on initial render', async () => {
      // GIVEN: the backend returns clients, no prior sort interaction has occurred
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(createClientes(3), { status: 200 })))

      // WHEN: the list first renders
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // THEN: "Más reciente" is shown as the current SortControl selection
      expect(screen.getByTestId('sort-control')).toHaveTextContent('Más reciente')
    })

    test('should render the initial list order newest-createdAt-first by default', async () => {
      // GIVEN: clients with distinct createdAt values, returned in a shuffled order
      const oldest = createCliente({ nombre: 'Cliente Antiguo', createdAt: '2024-01-01T00:00:00.000Z' })
      const newest = createCliente({ nombre: 'Cliente Reciente', createdAt: '2024-06-01T00:00:00.000Z' })
      const middle = createCliente({ nombre: 'Cliente Intermedio', createdAt: '2024-03-01T00:00:00.000Z' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([middle, oldest, newest], { status: 200 })))

      // WHEN: the list first renders with no prior sort interaction
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // THEN: the initial DOM order is newest-createdAt-first (fecha-desc default)
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual(['Cliente Reciente', 'Cliente Intermedio', 'Cliente Antiguo'])
      })
    })
  })

  describe('Cache integrity - sort must not mutate the TanStack Query cache in place', () => {
    test('should preserve the original fetched array order in the ClienteListView list after a sort interaction re-renders', async () => {
      // GIVEN: clients are loaded in a specific, known API order
      const first = createCliente({ nombre: 'Zeta Comercial', createdAt: '2024-01-01T00:00:00.000Z' })
      const second = createCliente({ nombre: 'Alfa Distribuciones', createdAt: '2024-02-01T00:00:00.000Z' })
      server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([first, second], { status: 200 })))
      const user = userEvent.setup()
      renderList()
      await screen.findAllByTestId('cliente-list-item')

      // WHEN: the user sorts, then switches back to the default sort order
      await selectSortOption(user, 'Nombre A→Z')
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual(['Alfa Distribuciones', 'Zeta Comercial'])
      })
      await selectSortOption(user, 'Más reciente')

      // THEN: re-deriving fecha-desc order from the (unmutated) cache yields the
      // correct chronological order — this only holds if the earlier sort never
      // mutated the underlying cached array in place (Array.prototype.sort
      // mutates its receiver; the pipeline must sort a copy, per Task 2 note)
      await waitFor(() => {
        expect(getRenderedNombres()).toEqual(['Alfa Distribuciones', 'Zeta Comercial'])
      })
    })
  })
})
