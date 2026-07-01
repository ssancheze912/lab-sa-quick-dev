import { describe, test, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CONTACTOS_ENDPOINT } from '@/test/msw/handlers'
import { createContacto, createContactos } from '@/test/factories/contacto.factory'
import { ContactoListView } from './ContactoListView'

// RED PHASE: ContactoListView.tsx does not exist yet. This test isolates
// NFR1/NFR10 ("<1s with up to 1,000 records" — double Epic 2's 500-record
// benchmark, per Test Design R3) from the functional ContactoListView suite
// per test-design-epic-3.md TC-E3-P1-02, so a perf regression failure is
// never conflated with a functional assertion failure (test-quality.md: one
// concern per test file/assertion).

describe('ContactoListView - NFR1/NFR10 performance (TC-E3-P1-02)', () => {
  test('should render the filtered list in under 1000ms with 1,000 seeded contacts', async () => {
    // GIVEN: 1,000 contacts are loaded, including one uniquely-named target
    // (double Epic 2's 500-record fixture — Epic 3's NFR10 ceiling for
    // contacts is stricter, per Test Design R3)
    const target = createContacto({ nombre: 'Contacto Objetivo Único' })
    const contactos = [...createContactos(999), target]
    server.use(http.get(CONTACTOS_ENDPOINT, () => HttpResponse.json(contactos, { status: 200 })))
    const user = userEvent.setup()

    renderWithRouter(<ContactoListView />, { initialPath: '/contactos', withQueryClient: true })
    await screen.findAllByTestId('contacto-list-item')
    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1000)

    // WHEN: the user types a search query that narrows the 1,000-record set
    const start = performance.now()
    await user.type(screen.getByTestId('contacto-search-input'), 'Contacto Objetivo Único')

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1)
    })
    const elapsed = performance.now() - start

    // THEN: the filtered DOM update completes in under 1 second end-to-end (NFR1/NFR10)
    expect(elapsed).toBeLessThan(1000)
  })
})
