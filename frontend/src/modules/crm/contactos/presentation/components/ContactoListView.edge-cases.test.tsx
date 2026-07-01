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
 * Expands beyond the ATDD suite (`ContactoListView.test.tsx`) with search-input
 * edge cases not covered by the AC-driven happy/sad paths: special/regex
 * characters, whitespace handling, unicode, single-character terms, and
 * defensive rendering. Payload/network edge cases live in the sibling file
 * `ContactoListView.resilience.edge-cases.test.tsx` (test-quality.md: keep
 * files lean, split by concern). Mirrors the convention established by
 * Story 2.1's `ClienteListView.edge-cases.test.tsx`.
 *
 * Priorities: P1 (data-safety/regressions likely to surface in prod),
 * P2 (edge cases with moderate impact).
 */

function renderList() {
  return renderWithRouter(<ContactoListView />, { initialPath: '/contactos', withQueryClient: true })
}

describe('ContactoListView - edge cases (search input handling)', () => {
  test('[P2] should treat a whitespace-only search term as empty and show the full list', async () => {
    // GIVEN: the list is loaded with several contacts
    const contactos = createContactos(4)
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // WHEN: the user types only spaces
    await user.type(screen.getByTestId('contacto-search-input'), '   ')

    // THEN: no filtering is applied (whitespace-only term treated as empty per .trim() logic)
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(4)
    })
    expect(screen.queryByTestId('empty-state-search-empty')).not.toBeInTheDocument()
  })

  test('[P1] should not throw and should show search-empty when the term contains regex special characters', async () => {
    // GIVEN: a contact list loaded
    const contactos = createContactos(3)
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // WHEN: the user pastes characters that are special in regex (but the filter uses
    // plain substring matching via String#includes, so these must be treated literally).
    // `paste` is used instead of `type` because several of these characters
    // (`{`, `[`) are reserved key-descriptor syntax for userEvent.type's keyboard parser.
    const input = screen.getByTestId('contacto-search-input')
    await user.click(input)
    await user.paste('.*+?()[]{}|^$\\')

    // THEN: the app doesn't crash and shows the "no results" state (no contact
    // nombre/email is expected to literally contain these characters)
    const searchEmpty = await screen.findByTestId('empty-state-search-empty')
    expect(searchEmpty).toBeInTheDocument()
  })

  test('[P2] should match contacts whose email literally contains a substring with special characters', async () => {
    // GIVEN: a contact whose email contains a plus-addressing tag (a common real-world pattern)
    const target = createContacto({ email: 'juan.perez+ventas@ejemplo.co' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // WHEN: the user searches using the literal plus-sign substring
    await user.type(screen.getByTestId('contacto-search-input'), '+ventas')

    // THEN: the contact matches (plain substring match, not a broken regex)
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
    })
  })

  test('[P2] should match accented/unicode characters case-insensitively across both fields', async () => {
    // GIVEN: a contact with accented characters in its nombre
    const target = createContacto({ nombre: 'José Ángel Muñoz' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // WHEN: the user searches with different accent casing
    await user.type(screen.getByTestId('contacto-search-input'), 'ÁNGEL MUÑOZ')

    // THEN: the contact still matches (case-insensitive, accent-preserving substring match)
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
    })
  })

  test('[P1] should restore the full list when the search input is cleared after filtering', async () => {
    // GIVEN: a filtered list with zero results
    const contactos = createContactos(3)
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')
    const input = screen.getByTestId('contacto-search-input')
    await user.type(input, 'no-existe-zzz')
    await screen.findByTestId('empty-state-search-empty')

    // WHEN: the user clears the search input
    await user.clear(input)

    // THEN: the full list is restored and the empty state disappears
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(3)
    })
    expect(screen.queryByTestId('empty-state-search-empty')).not.toBeInTheDocument()
  })

  test('[P2] should filter correctly with a single-character search term', async () => {
    // GIVEN: contacts where only one contains a distinctive single letter substring
    const target = createContacto({ nombre: 'Zetatech Ingeniería' })
    const other = createContacto({ nombre: 'Alfa Comercial' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target, other], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // WHEN: the user types a single character present only in the target's nombre
    await user.type(screen.getByTestId('contacto-search-input'), 'Z')

    // THEN: only the matching contact remains
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
    })
    expect(screen.getByText('Zetatech Ingeniería')).toBeInTheDocument()
  })

  test('[P2] should ignore leading/trailing whitespace in the search term when matching', async () => {
    // GIVEN: a target contact
    const target = createContacto({ nombre: 'Constructora del Valle' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')

    // WHEN: the user types the term with leading/trailing spaces
    await user.type(screen.getByTestId('contacto-search-input'), '  Valle  ')

    // THEN: the contact still matches (term is trimmed before matching)
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
    })
  })

  test('[P1] should not crash and should render safely when nombre contains HTML-like content (no injection)', async () => {
    // GIVEN: a contact whose nombre contains an HTML/script-like string (defensive
    // rendering check — React escapes text content by default, this guards
    // against a future regression, e.g. accidental dangerouslySetInnerHTML use)
    const target = createContacto({ nombre: '<script>alert(1)</script> Contacto' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([target], { status: 200 })))

    // WHEN: the list renders
    renderList()
    const item = await screen.findByTestId('contacto-list-item')

    // THEN: the content is rendered as inert text, not executed/injected as markup
    expect(within(item).getByText(/<script>alert\(1\)<\/script> Contacto/)).toBeInTheDocument()
    expect(document.querySelector('script[data-injected]')).not.toBeInTheDocument()
  })

  test('[P1] should switch from a nombre-match set to an email-match set as the user refines the query (R6)', async () => {
    // GIVEN: two contacts sharing the "compartido" substring — one only in its
    // nombre, the other only in its email (proves both fields are checked
    // independently as the user refines the query, not just nombre)
    const byNombre = createContacto({ nombre: 'Contacto Compartido Uno', email: 'aaa@ejemplo.co' })
    const byEmail = createContacto({ nombre: 'Otro Distinto', email: 'compartido.dos@ejemplo.co' })
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json([byNombre, byEmail], { status: 200 })))
    const user = userEvent.setup()
    renderList()
    await screen.findAllByTestId('contacto-list-item')
    const input = screen.getByTestId('contacto-search-input')

    // WHEN: the user first types a term matching both via the shared "compartido" text
    await user.type(input, 'compartido')
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2)
    })

    // AND: refines the query to a term that only exists in the second contact's email
    await user.type(input, '.dos')

    // THEN: the list narrows to just the email-matching contact (R6: email checked independently)
    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
    })
    expect(screen.getByText('Otro Distinto')).toBeInTheDocument()
  })
})
