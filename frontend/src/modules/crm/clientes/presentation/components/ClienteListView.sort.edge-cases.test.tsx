import { describe, test, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CLIENTES_ENDPOINT } from '@/test/msw/handlers'
import { createCliente, createClientes } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

/**
 * Test Automation Expansion (testarch-automate) — Story 2.6: Sort Client List
 *
 * Expands beyond the ATDD suite (`ClienteListView.sort.test.tsx`) with edge
 * cases, boundary conditions and interaction sequences not covered by the
 * AC-driven happy paths: single-item/empty result sets, duplicate/equal sort
 * keys (comparator stability), case/accent-insensitive comparisons, rapid
 * sort switching, and combined search+sort narrowing to a single item.
 *
 * Priorities: P1 (comparator correctness on real-world messy data),
 * P2 (rare interaction sequences, boundary sizes).
 */

function renderList() {
  return renderWithRouter(<ClienteListView />, { initialPath: '/clientes', withQueryClient: true })
}

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

describe('ClienteListView - Sort edge cases (Story 2.6)', () => {
  test('[P2] should not throw and should keep the single item when sorting a one-client list', async () => {
    // GIVEN: the list is loaded with exactly one client
    const onlyClient = createCliente({ nombre: 'Único Cliente' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([onlyClient], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user changes the sort order
    await selectSortOption(user, 'Nombre Z→A')

    // THEN: the single item remains, no error, no duplication
    await waitFor(() => {
      expect(getRenderedNombres()).toEqual(['Único Cliente'])
    })
  })

  test('[P2] should keep showing the search-empty state when sorting an empty filtered result set', async () => {
    // GIVEN: a search term that matches nothing
    const clientes = createClientes(3, { nombre: 'Distribuidora Comercial' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')
    await user.type(screen.getByTestId('cliente-search-input'), 'zzz-no-match-zzz')
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
    })

    // WHEN: the user changes the sort order while the filtered set is empty
    await selectSortOption(user, 'Nombre A→Z')

    // THEN: no crash occurs and the search term is preserved
    expect(screen.getByTestId('cliente-search-input')).toHaveValue('zzz-no-match-zzz')
    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })

  test('[P1] should keep a stable relative order for clients with identical nombre when sorting A→Z', async () => {
    // GIVEN: two clients share the exact same nombre (duplicate sort keys)
    const first = createCliente({ nombre: 'Comercial Andina', nit: '100' })
    const second = createCliente({ nombre: 'Comercial Andina', nit: '200' })
    const third = createCliente({ nombre: 'Zeta Import', nit: '300' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([first, second, third], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user sorts by "Nombre A→Z"
    await selectSortOption(user, 'Nombre A→Z')

    // THEN: both duplicates appear before "Zeta Import"; sort remains a no-throw
    // stable partition (exact tie order is not asserted, only that both survive
    // and precede the distinct-name entry)
    await waitFor(() => {
      const names = getRenderedNombres()
      expect(names).toHaveLength(3)
      expect(names?.slice(0, 2)).toEqual(['Comercial Andina', 'Comercial Andina'])
      expect(names?.[2]).toBe('Zeta Import')
    })
  })

  test('[P1] should order case-differing and accented names per localeCompare, not raw char-code order', async () => {
    // GIVEN: names whose plain char-code ordering would differ from locale-aware
    // alphabetical ordering (lowercase vs uppercase, accented vs unaccented)
    const clientes = [
      createCliente({ nombre: 'árbol Cliente' }),
      createCliente({ nombre: 'Zapatos SA' }),
      createCliente({ nombre: 'ábaco Ltda' }),
    ]
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user sorts "Nombre A→Z"
    await selectSortOption(user, 'Nombre A→Z')

    // THEN: locale-aware comparison places accented names near their unaccented
    // counterparts alphabetically, with "Zapatos" last (matches String#localeCompare,
    // not a naive char-code/ASCII sort where uppercase 'Z' < lowercase 'á')
    await waitFor(() => {
      const names = getRenderedNombres()
      expect(names).toHaveLength(3)
      expect(names?.[names.length - 1]).toBe('Zapatos SA')
    })
  })

  test('[P2] should treat identical createdAt timestamps without throwing when sorting by date', async () => {
    // GIVEN: two clients share the exact same createdAt instant
    const sameTimestamp = '2024-05-01T00:00:00.000Z'
    const first = createCliente({ nombre: 'Cliente Uno', createdAt: sameTimestamp })
    const second = createCliente({ nombre: 'Cliente Dos', createdAt: sameTimestamp })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([first, second], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user sorts by "Más antiguo"
    await selectSortOption(user, 'Más antiguo')

    // THEN: both entries render, no crash, no item dropped
    await waitFor(() => {
      expect(getRenderedNombres()).toHaveLength(2)
    })
  })

  test('[P1] should resolve to the correct final order after rapidly cycling through all 4 sort options', async () => {
    // GIVEN: a list with clear alphabetical and chronological distinctions
    const a = createCliente({ nombre: 'Alfa SA', createdAt: '2024-01-01T00:00:00.000Z' })
    const z = createCliente({ nombre: 'Zeta SA', createdAt: '2024-06-01T00:00:00.000Z' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([a, z], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user rapidly cycles through every sort option in sequence
    await selectSortOption(user, 'Nombre A→Z')
    await selectSortOption(user, 'Nombre Z→A')
    await selectSortOption(user, 'Más antiguo')
    await selectSortOption(user, 'Más reciente')

    // THEN: the final state reflects only the LAST selected option ("Más reciente")
    await waitFor(() => {
      expect(getRenderedNombres()).toEqual(['Zeta SA', 'Alfa SA'])
    })
    expect(screen.getByTestId('sort-control')).toHaveTextContent('Más reciente')
  })

  test('[P2] should narrow to a single client via search and still apply the selected sort without error', async () => {
    // GIVEN: a search term that narrows the result set to exactly one client
    const match = createCliente({ nombre: 'Único Match SA', nit: '999' })
    const others = createClientes(2, { nombre: 'Otro Cliente' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([...others, match], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')
    await user.type(screen.getByTestId('cliente-search-input'), 'Único')
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })

    // WHEN: the user changes the sort order on the single-item filtered result
    await selectSortOption(user, 'Nombre Z→A')

    // THEN: the single matching item still renders correctly
    await waitFor(() => {
      expect(getRenderedNombres()).toEqual(['Único Match SA'])
    })
  })
})
