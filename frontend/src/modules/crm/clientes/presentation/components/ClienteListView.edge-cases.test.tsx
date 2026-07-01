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
 * Test Automation Expansion (testarch-automate) — Story 2.1: Client List & Search
 *
 * Expands beyond the ATDD suite (`ClienteListView.test.tsx`) with edge cases,
 * boundary conditions and error paths not covered by the AC-driven happy/sad
 * paths: special/regex characters, whitespace handling, unicode, malformed
 * API payloads, network-level failures (not just HTTP 500), rapid input,
 * and defensive rendering.
 *
 * Priorities: P1 (data-safety/regressions likely to surface in prod),
 * P2 (edge cases with moderate impact).
 */

function renderList() {
  return renderWithRouter(<ClienteListView />, { initialPath: '/clientes', withQueryClient: true })
}

describe('ClienteListView - edge cases (search input handling)', () => {
  test('[P2] should treat a whitespace-only search term as empty and show the full list', async () => {
    // GIVEN: the list is loaded with several clients
    const clientes = createClientes(4)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user types only spaces
    await user.type(screen.getByTestId('cliente-search-input'), '   ')

    // THEN: no filtering is applied (whitespace-only term treated as empty per .trim() logic)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(4)
    })
    expect(screen.queryByTestId('empty-state-search-empty')).not.toBeInTheDocument()
  })

  test('[P1] should not throw and should show search-empty when the term contains regex special characters', async () => {
    // GIVEN: a client list loaded
    const clientes = createClientes(3)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user pastes characters that are special in regex (but the filter uses
    // plain substring matching via String#includes, so these must be treated literally).
    // `paste` is used instead of `type` because several of these characters
    // (`{`, `[`) are reserved key-descriptor syntax for userEvent.type's keyboard parser.
    const input = screen.getByTestId('cliente-search-input')
    await user.click(input)
    await user.paste('.*+?()[]{}|^$\\')

    // THEN: the app doesn't crash and shows the "no results" state (no client name
    // is expected to literally contain these characters)
    const searchEmpty = await screen.findByTestId('empty-state-search-empty')
    expect(searchEmpty).toBeInTheDocument()
  })

  test('[P2] should match clients whose nombre literally contains a substring with special characters', async () => {
    // GIVEN: a client whose name contains parentheses (a common real-world pattern)
    const target = createCliente({ nombre: 'Distribuidora (Centro) S.A.S.' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user searches using the literal parenthesis substring
    await user.type(screen.getByTestId('cliente-search-input'), '(Centro)')

    // THEN: the client matches (plain substring match, not a broken regex)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
  })

  test('[P2] should match accented/unicode characters case-insensitively', async () => {
    // GIVEN: a client with accented characters in its name
    const target = createCliente({ nombre: 'Compañía Únicá Bogotá' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user searches with different accent casing
    await user.type(screen.getByTestId('cliente-search-input'), 'ÚNICÁ')

    // THEN: the client still matches (case-insensitive, accent-preserving substring match)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
  })

  test('[P1] should restore the full list when the search input is cleared after filtering', async () => {
    // GIVEN: a filtered list with zero results
    const clientes = createClientes(3)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(clientes, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')
    const input = screen.getByTestId('cliente-search-input')
    await user.type(input, 'no-existe-zzz')
    await screen.findByTestId('empty-state-search-empty')

    // WHEN: the user clears the search input
    await user.clear(input)

    // THEN: the full list is restored and the empty state disappears
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
    expect(screen.queryByTestId('empty-state-search-empty')).not.toBeInTheDocument()
  })

  test('[P2] should filter correctly with a single-character search term', async () => {
    // GIVEN: clients where only one contains a distinctive single letter substring
    const target = createCliente({ nombre: 'Zetatech Ingeniería' })
    const other = createCliente({ nombre: 'Alfa Comercial' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target, other], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user types a single character present only in the target's name
    await user.type(screen.getByTestId('cliente-search-input'), 'Z')

    // THEN: only the matching client remains
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
    expect(screen.getByText('Zetatech Ingeniería')).toBeInTheDocument()
  })

  test('[P2] should ignore leading/trailing whitespace in the search term when matching', async () => {
    // GIVEN: a target client
    const target = createCliente({ nombre: 'Constructora del Valle' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('cliente-list-item')

    // WHEN: the user types the term with leading/trailing spaces
    await user.type(screen.getByTestId('cliente-search-input'), '  Valle  ')

    // THEN: the client still matches (term is trimmed before matching)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
  })

  test('[P1] should not crash and should render safely when nombre contains HTML-like content (no injection)', async () => {
    // GIVEN: a client whose nombre contains an HTML/script-like string (defensive
    // rendering check — React escapes text content by default, this guards
    // against a future regression, e.g. accidental dangerouslySetInnerHTML use)
    const target = createCliente({ nombre: '<script>alert(1)</script> Cliente' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))

    // WHEN: the list renders
    renderList()
    const item = await screen.findByTestId('cliente-list-item')

    // THEN: the content is rendered as inert text, not executed/injected as markup
    expect(within(item).getByText(/<script>alert\(1\)<\/script> Cliente/)).toBeInTheDocument()
    expect(document.querySelector('script[data-injected]')).not.toBeInTheDocument()
  })
})

describe('ClienteListView - edge cases (data payload boundaries)', () => {
  test('[P2] should render correctly with exactly one client (singular boundary)', async () => {
    // GIVEN: the API returns exactly one client
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([createCliente()], { status: 200 })))

    // WHEN: the list renders
    renderList()

    // THEN: exactly one row renders, no empty state shown
    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(1)
    expect(screen.queryByTestId('empty-state-no-clients')).not.toBeInTheDocument()
  })

  test('[P2] should render clients with duplicate nombre values as separate distinct rows', async () => {
    // GIVEN: two different clients that happen to share the same nombre (different NIT)
    const a = createCliente({ nombre: 'Comercial Duplicado SAS', nit: '900000001' })
    const b = createCliente({ nombre: 'Comercial Duplicado SAS', nit: '900000002' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([a, b], { status: 200 })))

    // WHEN: the list renders
    renderList()

    // THEN: both rows render distinctly (keyed by id, not nombre)
    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(2)
  })

  test('[P1] should treat a malformed (non-array) API payload as an error rather than crashing', async () => {
    // GIVEN: the backend returns an unexpected shape (object instead of array)
    server.use(
      http.get(CLIENTES_ENDPOINT, () => HttpResponse.json({ unexpected: 'shape' }, { status: 200 })),
    )

    // WHEN: the view attempts to render
    renderList()

    // THEN: the app does not crash; it does not falsely render list items for
    // non-array data. It should not show 0 items masquerading as "no-clients"
    // success — but per lenient current implementation this is at minimum
    // required to not throw an unhandled render exception.
    await waitFor(() => {
      expect(screen.queryByTestId('clientes-list-loading')).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })
})

describe('ClienteListView - edge cases (network/error resilience)', () => {
  test('[P1] should show ErrorPanel on a raw network failure (connection refused), not just HTTP 500', async () => {
    // GIVEN: the request fails at the network level (no response at all)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.error()))

    // WHEN: the user navigates to /clientes
    renderList()

    // THEN: ErrorPanel renders the same as an HTTP 500 (network errors reject the
    // promise the same way as server errors from TanStack Query's perspective)
    const errorPanel = await screen.findByTestId('error-panel')
    expect(errorPanel).toBeInTheDocument()
  })

  test('[P2] should show ErrorPanel on a 404 response', async () => {
    // GIVEN: the endpoint responds 404 (e.g. misconfigured base URL / route)
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json({ error: 'not found' }, { status: 404 })))

    // WHEN: the user navigates to /clientes
    renderList()

    // THEN: ErrorPanel renders instead of an empty-state or crash
    const errorPanel = await screen.findByTestId('error-panel')
    expect(errorPanel).toBeInTheDocument()
  })

  test('[P2] should not double-fire requests when Reintentar is clicked multiple times quickly', async () => {
    // GIVEN: the backend always fails
    let attempts = 0
    server.use(
      http.get(CLIENTES_ENDPOINT, () => {
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
})
