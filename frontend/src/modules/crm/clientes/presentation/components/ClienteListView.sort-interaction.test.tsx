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
// sort wiring (Story 2.6, Task 2). Split out of ClienteListView.sort.test.tsx
// (TEA test-review: file exceeded the 300-line size guideline) to isolate the
// combined search+sort interaction (AC #5) and cache-integrity guard from the
// per-criterion sort tests (AC #1-#4, #6), which remain in the sibling file.
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

describe('ClienteListView - Sort interaction with search & cache (Story 2.6)', () => {
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
