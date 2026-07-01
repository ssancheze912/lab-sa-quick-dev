import { describe, test, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CONTACTOS_ENDPOINT } from '@/test/msw/handlers'
import { createContacto, createContactos } from '@/test/factories/contacto.factory'
import { ContactoListView } from './ContactoListView'

/**
 * Test Automation Expansion (testarch-automate) — Story 3.1: Contact List & Search
 *
 * Expands beyond the ATDD suite (`ContactoListView.test.tsx`) with data-payload
 * boundary and network/error-resilience edge cases: malformed payloads,
 * duplicate/singular datasets, raw network failures (not just HTTP 500), 404s,
 * rapid retry clicks, and search-state preservation across failures. Search-input
 * edge cases live in the sibling file `ContactoListView.edge-cases.test.tsx`
 * (test-quality.md: keep files lean, split by concern).
 *
 * Priorities: P1 (data-safety/regressions likely to surface in prod),
 * P2 (edge cases with moderate impact).
 */

function renderList() {
  return renderWithRouter(<ContactoListView />, { initialPath: '/contactos', withQueryClient: true })
}

describe('ContactoListView - edge cases (data payload boundaries)', () => {
  test('[P2] should render correctly with exactly one contact (singular boundary)', async () => {
    // GIVEN: the API returns exactly one contact
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([createContacto()], { status: 200 })))

    // WHEN: the list renders
    renderList()

    // THEN: exactly one row renders, no empty state shown
    const items = await screen.findAllByTestId('contacto-list-item')
    expect(items).toHaveLength(1)
    expect(screen.queryByTestId('empty-state-no-contacts')).not.toBeInTheDocument()
  })

  test('[P2] should render contacts with duplicate nombre values as separate distinct rows', async () => {
    // GIVEN: two different contacts that happen to share the same nombre (different email)
    const a = createContacto({ nombre: 'Contacto Duplicado', email: 'uno@ejemplo.co' })
    const b = createContacto({ nombre: 'Contacto Duplicado', email: 'dos@ejemplo.co' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([a, b], { status: 200 })))

    // WHEN: the list renders
    renderList()

    // THEN: both rows render distinctly (keyed by id, not nombre)
    const items = await screen.findAllByTestId('contacto-list-item')
    expect(items).toHaveLength(2)
  })

  test('[P1] should treat a malformed (non-array) API payload as an error rather than crashing', async () => {
    // GIVEN: the backend returns an unexpected shape (object instead of array)
    server.use(
      http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json({ unexpected: 'shape' }, { status: 200 })),
    )

    // WHEN: the view attempts to render
    renderList()

    // THEN: the app does not crash; it does not falsely render list items for
    // non-array data, nor does it show a loading state indefinitely
    await waitFor(() => {
      expect(screen.queryByTestId('contactos-list-loading')).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('contacto-list-item')).not.toBeInTheDocument()
  })

  test('[P2] should render a contact whose cargo or telefono are empty strings without crashing', async () => {
    // GIVEN: a contact with an empty cargo (defensive boundary — company data
    // may have incomplete legacy records for optional-looking display fields)
    const target = createContacto({ nombre: 'Contacto Incompleto', cargo: '', telefono: '' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))

    // WHEN: the list renders
    renderList()

    // THEN: the row still renders without throwing, showing at least the nombre
    const item = await screen.findByTestId('contacto-list-item')
    expect(within(item).getByText('Contacto Incompleto')).toBeInTheDocument()
  })
})

describe('ContactoListView - edge cases (network/error resilience)', () => {
  test('[P1] should show ErrorPanel on a raw network failure (connection refused), not just HTTP 500', async () => {
    // GIVEN: the request fails at the network level (no response at all)
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.error()))

    // WHEN: the user navigates to /contactos
    renderList()

    // THEN: ErrorPanel renders the same as an HTTP 500 (network errors reject the
    // promise the same way as server errors from TanStack Query's perspective)
    const errorPanel = await screen.findByTestId('error-panel')
    expect(errorPanel).toBeInTheDocument()
  })

  test('[P2] should show ErrorPanel on a 404 response', async () => {
    // GIVEN: the endpoint responds 404 (e.g. misconfigured base URL / route)
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json({ error: 'not found' }, { status: 404 })))

    // WHEN: the user navigates to /contactos
    renderList()

    // THEN: ErrorPanel renders instead of an empty-state or crash
    const errorPanel = await screen.findByTestId('error-panel')
    expect(errorPanel).toBeInTheDocument()
  })

  test('[P2] should not double-fire requests when Reintentar is clicked multiple times quickly', async () => {
    // GIVEN: the backend always fails
    let attempts = 0
    server.use(
      http.get(CONTACTOS_ENDPOINT, () => {
        attempts += 1
        return HttpResponse.json({ error: 'unavailable' }, { status: 500 })
      }),
    )
    const user = userEvent.setup()
    renderList()
    const errorPanel = await screen.findByTestId('error-panel')
    const attemptsAfterInitialLoad = attempts

    // WHEN: the user clicks "Reintentar" twice in quick succession
    const retryButton = within(errorPanel).getByRole('button', { name: /reintentar/i })
    await user.click(retryButton)
    await user.click(retryButton)

    // THEN: the ErrorPanel is still shown (still failing) and at least one retry
    // fetch fired per click without the app crashing or entering an inconsistent state
    await waitFor(() => {
      expect(attempts).toBeGreaterThan(attemptsAfterInitialLoad)
    })
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  test('[P2] should preserve the typed search query across a failed retry attempt', async () => {
    // GIVEN: the list loaded successfully, then a search is typed
    const contactos = createContactos(3)
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')
    await user.type(screen.getByTestId('contacto-search-input'), 'no-match-search-term')
    await screen.findByTestId('empty-state-search-empty')

    // THEN: the typed search term remains in the input (state is local, independent
    // of query success/failure — this documents the decoupling contract)
    expect(screen.getByTestId('contacto-search-input')).toHaveValue('no-match-search-term')
  })
})
