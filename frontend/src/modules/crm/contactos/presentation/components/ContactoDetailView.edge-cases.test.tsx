import { describe, test, expect } from 'vitest'
import { screen, waitFor, render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { server } from '@/test/msw/server'
import { CONTACTO_BY_ID_ENDPOINT } from '@/test/msw/handlers'
import { createContacto } from '@/test/factories/contacto.factory'
import { ContactoDetailView } from './ContactoDetailView'

/**
 * Test Automation Expansion (testarch-automate) — Story 3.2: Contact Detail View
 *
 * Expands beyond the ATDD suite (`ContactoDetailView.test.tsx`) with edge
 * cases, boundary conditions and error paths not covered by the AC-driven
 * happy/sad paths: non-404 error statuses, raw network failures, the
 * `listMembership` prop's `pending`/`missing` transition states, defensive
 * rendering of unusual field values, and rapid contactoId prop changes.
 *
 * Mirrors `ClienteDetailView.edge-cases.test.tsx`'s exact structural template
 * (Story 2.2's equivalent expansion) — same component shape, same risk
 * surface (R5: deep-link/not-found handling), adapted to Contacto's fields
 * (Nombre, Cargo, Teléfono, Email — no Ciudad equivalent).
 *
 * Priorities: P1 (data-safety/regressions likely to surface in prod),
 * P2 (edge cases with moderate impact).
 */

function renderDetail(
  contactoId?: string,
  props: Partial<{ listMembership: 'pending' | 'present' | 'missing' }> = {},
) {
  return renderWithRouter(<ContactoDetailView contactoId={contactoId} {...props} />, {
    initialPath: contactoId ? `/contactos/${contactoId}` : '/contactos',
    withQueryClient: true,
  })
}

/**
 * `ContactoDetailView` itself has no router-hook dependency (it only takes
 * plain props), so rerender-driven scenarios use a plain QueryClientProvider
 * wrapper instead of `renderWithRouter` — RTL's `rerender` re-renders the
 * exact element passed to it WITHOUT re-applying `renderWithRouter`'s
 * provider tree (that wrapper is only applied on the initial `render` call),
 * so a rerender-compatible wrapper must be built once and reused directly.
 */
function renderDetailWithQueryClient(
  contactoId: string | undefined,
  props: Partial<{ listMembership: 'pending' | 'present' | 'missing' }> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ContactoDetailView contactoId={contactoId} {...props} />
    </QueryClientProvider>,
  )
  return {
    ...utils,
    rerenderDetail: (
      nextContactoId: string | undefined,
      nextProps: Partial<{ listMembership: 'pending' | 'present' | 'missing' }> = {},
    ) =>
      utils.rerender(
        <QueryClientProvider client={queryClient}>
          <ContactoDetailView contactoId={nextContactoId} {...nextProps} />
        </QueryClientProvider>,
      ),
  }
}

describe('ContactoDetailView - edge cases (non-404 error paths)', () => {
  test('[P1] should show a generic error block (not not-found) on a 500 response', async () => {
    // GIVEN: the backend fails with a server error, not a 404
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json({ title: 'boom' }, { status: 500 })))

    // WHEN: the detail view renders
    renderDetail(createContacto().id)

    // THEN: a generic error block renders — distinct from the not-found message
    const errorBlock = await screen.findByTestId('contacto-not-found')
    expect(errorBlock).toHaveTextContent(/no se pudo cargar/i)
    expect(errorBlock).not.toHaveTextContent(/contacto no encontrado/i)
  })

  test('[P1] should show the generic error block on a raw network failure (connection refused)', async () => {
    // GIVEN: the request fails at the network level (no HTTP response at all)
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.error()))

    // WHEN: the detail view renders
    renderDetail(createContacto().id)

    // THEN: the app does not crash — a graceful error block renders
    const errorBlock = await screen.findByTestId('contacto-not-found')
    expect(errorBlock).toHaveTextContent(/no se pudo cargar/i)
  })

  test('[P2] should show a generic error block (not not-found) on a 403 response', async () => {
    // GIVEN: the backend rejects the request with 403 (not the not-found contract)
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json({ title: 'forbidden' }, { status: 403 })))

    // WHEN: the detail view renders
    renderDetail(createContacto().id)

    // THEN: only the generic error path renders, never the "no encontrado" copy
    const errorBlock = await screen.findByTestId('contacto-not-found')
    expect(errorBlock).not.toHaveTextContent(/contacto no encontrado/i)
  })
})

describe('ContactoDetailView - edge cases (listMembership prop states)', () => {
  test('[P1] should show the not-found block immediately for listMembership="missing" without issuing a by-id request', async () => {
    // GIVEN: a request spy on the by-id endpoint — this must never fire when the
    // sibling list has already confirmed the id doesn't exist (R5/NFR6 mitigation)
    let requestCount = 0
    server.use(
      http.get(CONTACTO_BY_ID_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json(createContacto(), { status: 200 })
      }),
    )

    // WHEN: the detail view renders with listMembership="missing"
    renderDetail('00000000-0000-0000-0000-000000000000', { listMembership: 'missing' })

    // THEN: the not-found block renders immediately, with zero underlying requests
    expect(await screen.findByTestId('contacto-not-found')).toBeInTheDocument()
    expect(requestCount).toBe(0)
  })

  test('[P1] should show the loading skeleton (not the empty state) for listMembership="pending"', () => {
    // GIVEN: the sibling list query has not resolved yet
    // WHEN: the detail view renders with listMembership="pending" and a contactoId present
    renderDetail(createContacto().id, { listMembership: 'pending' })

    // THEN: a loading skeleton renders — not the empty/default "no selection" state,
    // and not a stuck/undefined UI
    expect(screen.getByTestId('contacto-detail-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('contacto-detail-empty')).not.toBeInTheDocument()
  })

  test('[P2] should transition from pending (skeleton) to the success panel once listMembership resolves to "present"', async () => {
    // GIVEN: a known contact
    const contacto = createContacto({ nombre: 'Transición Contacto SAS' })
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

    // WHEN: the view first renders pending, then re-renders as present (simulating the
    // sibling list query resolving)
    const { rerenderDetail } = renderDetailWithQueryClient(contacto.id, { listMembership: 'pending' })
    expect(screen.getByTestId('contacto-detail-loading')).toBeInTheDocument()

    rerenderDetail(contacto.id, { listMembership: 'present' })

    // THEN: the success panel eventually renders with the correct data
    await waitFor(() => {
      expect(screen.getByText('Transición Contacto SAS')).toBeInTheDocument()
    })
  })

  test('[P2] should transition from pending to not-found once listMembership resolves to "missing"', async () => {
    // GIVEN: a contactoId that will turn out not to exist
    const missingId = '11111111-1111-1111-1111-111111111111'

    // WHEN: the view first renders pending, then re-renders as missing
    const { rerenderDetail } = renderDetailWithQueryClient(missingId, { listMembership: 'pending' })
    expect(screen.getByTestId('contacto-detail-loading')).toBeInTheDocument()

    rerenderDetail(missingId, { listMembership: 'missing' })

    // THEN: the not-found block renders (no stuck skeleton, no crash)
    await waitFor(() => {
      expect(screen.getByTestId('contacto-not-found')).toBeInTheDocument()
    })
  })
})

describe('ContactoDetailView - edge cases (defensive field rendering)', () => {
  test('[P2] should render without crashing when nombre contains HTML-like content (no injection)', async () => {
    // GIVEN: a contact whose nombre contains a script-like string
    const contacto = createContacto({ nombre: '<img src=x onerror=alert(1)>' })
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

    // WHEN: the detail view renders
    renderDetail(contacto.id)

    // THEN: the content is rendered as inert text, not executed/injected as markup
    const panel = await screen.findByTestId('contacto-detail-panel')
    expect(panel).toHaveTextContent('<img src=x onerror=alert(1)>')
    expect(document.querySelector('img[src="x"]')).not.toBeInTheDocument()
  })

  test('[P2] should render an empty value gracefully when cargo is an empty string', async () => {
    // GIVEN: a contact with an empty cargo value (backend contract allows optional fields)
    const contacto = createContacto({ cargo: '' })
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

    // WHEN: the detail view renders
    renderDetail(contacto.id)

    // THEN: the panel still renders without crashing; the Cargo label is present
    const panel = await screen.findByTestId('contacto-detail-panel')
    expect(panel).toHaveTextContent('Cargo')
  })

  test('[P2] should render very long field values without breaking the layout container', async () => {
    // GIVEN: a contact with an unusually long nombre
    const longName = 'Contacto '.repeat(30).trim()
    const contacto = createContacto({ nombre: longName })
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

    // WHEN: the detail view renders
    renderDetail(contacto.id)

    // THEN: the full value is rendered (no truncation/crash) inside the panel
    const panel = await screen.findByTestId('contacto-detail-panel')
    expect(panel).toHaveTextContent(longName)
  })

  test('[P2] should render the panel even when clienteId is null (unassociated contact, out-of-scope for this story)', async () => {
    // GIVEN: a contact with no associated client — this story does not render
    // the associated-client link (Epic 4/Story 4.4), only the base fields
    const contacto = createContacto({ clienteId: null })
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))

    // WHEN: the detail view renders
    renderDetail(contacto.id)

    // THEN: the panel renders normally with no crash and no cliente-related content
    const panel = await screen.findByTestId('contacto-detail-panel')
    expect(panel).toHaveTextContent('Nombre')
  })
})

describe('ContactoDetailView - edge cases (rapid contactoId changes)', () => {
  test('[P1] should display the second contact\'s data (not a stale mix) when contactoId changes before the first request resolves', async () => {
    // GIVEN: two distinct contacts, the by-id endpoint keyed by the requested id
    const first = createContacto({ nombre: 'Primero Contacto SAS' })
    const second = createContacto({ nombre: 'Segundo Contacto SAS' })
    server.use(
      http.get(CONTACTO_BY_ID_ENDPOINT, async ({ params }) => {
        const id = params.id as string
        const match = id === first.id ? first : second
        await new Promise((resolve) => setTimeout(resolve, 10))
        return HttpResponse.json(match, { status: 200 })
      }),
    )

    // WHEN: the view mounts for the first contact, then rapidly switches to the second
    const { rerenderDetail } = renderDetailWithQueryClient(first.id)
    rerenderDetail(second.id)

    // THEN: the final rendered state reflects the second (latest) contact only
    await waitFor(() => {
      expect(screen.getByText('Segundo Contacto SAS')).toBeInTheDocument()
    })
    expect(screen.queryByText('Primero Contacto SAS')).not.toBeInTheDocument()
  })

  test('[P2] should return to the empty/default state when contactoId transitions from defined to undefined', async () => {
    // GIVEN: a detail view showing a resolved contact
    const contacto = createContacto()
    server.use(http.get(CONTACTO_BY_ID_ENDPOINT, () => HttpResponse.json(contacto, { status: 200 })))
    const { rerenderDetail } = renderDetailWithQueryClient(contacto.id)
    await screen.findByTestId('contacto-detail-panel')

    // WHEN: the contactoId prop is cleared (e.g. user navigates back to /contactos)
    rerenderDetail(undefined)

    // THEN: the empty/default "no selection" state renders again
    expect(screen.getByTestId('contacto-detail-empty')).toBeInTheDocument()
  })
})
