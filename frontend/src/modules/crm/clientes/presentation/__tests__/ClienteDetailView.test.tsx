/**
 * Story 2.2: Client Detail View — Component Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - ClienteDetailView component does not exist yet
 * - useCliente hook does not exist yet
 *
 * Acceptance Criteria covered (this file):
 *   AC#1 — Clicking a client item shows Nombre, NIT/RUC, Teléfono, Ciudad in the right panel
 *   AC#2 — No client selected (clienteId=null) → placeholder message in right panel
 *   AC#3 — Direct URL access loads client detail correctly
 *   AC#4 — Non-existent clienteId → "Cliente no encontrado." message without crash
 *   AC#5 — Loading state → skeleton placeholder in right panel
 *   AC#6 — Switching clients updates right panel to new client details
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P1-08: Selecting client item updates detail panel and URL
 *   TC-E2-P2-03: Not-found message on /clientes/:id with non-existent UUID
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// RED: This import will fail until implementation exists.
// Expected failure: "Cannot find module '../ClienteDetailView'"
import { ClienteDetailView } from '../ClienteDetailView'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'
const CLIENT_A_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const CLIENT_B_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000'

const clienteA = createCliente({
  id: CLIENT_A_ID,
  nombre: 'Empresa ABC',
  nit: '900123456-7',
  telefono: '601 234 5678',
  ciudad: 'Bogotá',
})

const clienteB = createCliente({
  id: CLIENT_B_ID,
  nombre: 'Tecnología del Norte',
  nit: '800987654-1',
  telefono: '3001112233',
  ciudad: 'Medellín',
})

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_A_ID}`, () =>
    HttpResponse.json(clienteA)
  ),
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_B_ID}`, () =>
    HttpResponse.json(clienteB)
  ),
  http.get(`${API_BASE}/api/v1/clientes/${NON_EXISTENT_ID}`, () =>
    HttpResponse.json(
      { title: 'Cliente no encontrado.', status: 404 },
      { status: 404 }
    )
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Test Wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

// ─── AC#2: Placeholder state (no client selected) ────────────────────────────

describe('ClienteDetailView — AC#2: Placeholder when no client selected', () => {
  it('should render placeholder message when clienteId is null (AC#2)', () => {
    // GIVEN: no client is selected

    // WHEN: ClienteDetailView is rendered with clienteId=null
    renderWithProviders(<ClienteDetailView clienteId={null} />)

    // THEN: placeholder message is displayed
    // Expected failure: Cannot find module '../ClienteDetailView'
    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeInTheDocument()
  })

  it('should render placeholder with role="status" for accessibility (AC#2)', () => {
    // GIVEN: no client selected

    // WHEN: rendered with null id
    renderWithProviders(<ClienteDetailView clienteId={null} />)

    // THEN: placeholder has role="status" per WCAG 2.1 AA requirement
    const placeholder = screen.getByRole('status')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveTextContent('Selecciona un cliente para ver sus detalles.')
  })

  it('should NOT render detail content or skeleton when clienteId is null (AC#2)', () => {
    // GIVEN: no client selected

    // WHEN: rendered with null id
    renderWithProviders(<ClienteDetailView clienteId={null} />)

    // THEN: no detail view or skeleton visible
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })
})

// ─── AC#5: Loading state (skeleton) ──────────────────────────────────────────

describe('ClienteDetailView — AC#5: Loading skeleton', () => {
  it('should render skeleton placeholder while client data is loading (AC#5)', async () => {
    // GIVEN: network response is delayed (data not yet arrived)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_A_ID}`, async () => {
        // Never-resolving promise keeps loading state active during synchronous assertion
        await new Promise(() => undefined)
        return HttpResponse.json(clienteA)
      })
    )

    // WHEN: ClienteDetailView is rendered with a valid id
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    // THEN: skeleton placeholder is visible instead of detail content
    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument()
  })
})

// ─── AC#1 & AC#3: Detail renders with correct data ───────────────────────────

describe('ClienteDetailView — AC#1 & AC#3: Client detail rendering', () => {
  it('should render Nombre when client data arrives (AC#1, AC#3)', async () => {
    // GIVEN: MSW returns clienteA for CLIENT_A_ID

    // WHEN: ClienteDetailView is rendered with CLIENT_A_ID
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    // THEN: Nombre is displayed in the detail panel
    await waitFor(() => {
      expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    })
  })

  it('should render NIT/RUC when client data arrives (AC#1, AC#3)', async () => {
    // GIVEN: MSW returns clienteA

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    // THEN: NIT/RUC is visible in the detail panel
    await waitFor(() => {
      expect(screen.getByText('900123456-7')).toBeInTheDocument()
    })
  })

  it('should render Teléfono when client data arrives (AC#1, AC#3)', async () => {
    // GIVEN: MSW returns clienteA

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    // THEN: Teléfono is visible in the detail panel
    await waitFor(() => {
      expect(screen.getByText('601 234 5678')).toBeInTheDocument()
    })
  })

  it('should render Ciudad when client data arrives (AC#1, AC#3)', async () => {
    // GIVEN: MSW returns clienteA

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    // THEN: Ciudad is visible in the detail panel
    await waitFor(() => {
      expect(screen.getByText('Bogotá')).toBeInTheDocument()
    })
  })

  it('should render detail container with data-testid="cliente-detail-view" (AC#1)', async () => {
    // GIVEN: MSW returns clienteA

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    // THEN: detail container has required data-testid
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
  })

  it('should render all 4 field labels in Spanish (AC#1)', async () => {
    // GIVEN: MSW returns clienteA

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    // THEN: all 4 field labels are present in Spanish (as <dt> elements per story spec)
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()
  })
})

// ─── AC#1 & AC#3: WCAG / ARIA compliance ─────────────────────────────────────

describe('ClienteDetailView — WCAG 2.1 AA compliance', () => {
  it('should render article with aria-label containing client name (AC#1)', async () => {
    // GIVEN: MSW returns clienteA with nombre "Empresa ABC"

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    // THEN: article element has aria-label containing the client name (per story spec)
    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
    expect(article).toHaveAttribute('aria-label', expect.stringContaining('Empresa ABC'))
  })

  it('should use dl/dt/dd semantics for field groups (AC#1)', async () => {
    // GIVEN: MSW returns clienteA

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_A_ID} />)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    // THEN: description list semantics are used (per story spec)
    const dl = screen.getByTestId('cliente-detail-view').querySelector('dl')
    expect(dl).toBeInTheDocument()

    const dtElements = dl!.querySelectorAll('dt')
    const ddElements = dl!.querySelectorAll('dd')

    // 4 field groups: Nombre, NIT/RUC, Teléfono, Ciudad
    expect(dtElements.length).toBe(4)
    expect(ddElements.length).toBe(4)
  })
})

// ─── AC#4: Not-found state ────────────────────────────────────────────────────

describe('ClienteDetailView — AC#4: Not-found graceful handling (TC-E2-P2-03)', () => {
  it('should render "Cliente no encontrado." when API returns 404 (AC#4)', async () => {
    // GIVEN: MSW returns 404 for NON_EXISTENT_ID

    // WHEN: rendered with non-existent clienteId
    renderWithProviders(<ClienteDetailView clienteId={NON_EXISTENT_ID} />)

    // THEN: not-found message is displayed
    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })
  })

  it('should render not-found with role="status" (AC#4)', async () => {
    // GIVEN: MSW returns 404

    // WHEN: rendered with non-existent id
    renderWithProviders(<ClienteDetailView clienteId={NON_EXISTENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })

    // THEN: role="status" present on not-found container
    const statusEls = screen.getAllByRole('status')
    const notFoundEl = statusEls.find((el) =>
      el.textContent?.includes('Cliente no encontrado.')
    )
    expect(notFoundEl).toBeInTheDocument()
  })

  it('should NOT render skeleton or detail view when showing not-found (AC#4)', async () => {
    // GIVEN: MSW returns 404

    // WHEN: rendered
    renderWithProviders(<ClienteDetailView clienteId={NON_EXISTENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })

    // THEN: no skeleton and no detail content visible
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument()
  })

  it('should not crash or show blank screen on not-found (AC#4)', async () => {
    // GIVEN: MSW returns 404 for a UUID

    // WHEN: rendered — no exceptions should be thrown
    expect(() => {
      renderWithProviders(<ClienteDetailView clienteId={NON_EXISTENT_ID} />)
    }).not.toThrow()

    // THEN: not-found message renders without crash
    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })
  })
})

// ─── AC#6: Switching clients updates detail panel ────────────────────────────

describe('ClienteDetailView — AC#6: Switching clients updates the detail panel', () => {
  it('should update to new client data when clienteId prop changes (AC#6)', async () => {
    // GIVEN: rendered with clienteA
    const { rerender } = renderWithProviders(
      <ClienteDetailView clienteId={CLIENT_A_ID} />
    )

    await waitFor(() => {
      expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    })

    // WHEN: clienteId changes to clienteB
    rerender(
      <QueryClientProvider
        client={makeQueryClient()}
      >
        <ClienteDetailView clienteId={CLIENT_B_ID} />
      </QueryClientProvider>
    )

    // THEN: right panel updates to show clienteB's details
    await waitFor(() => {
      expect(screen.getByText('Tecnología del Norte')).toBeInTheDocument()
    })

    // AND: clienteA's data is no longer shown
    expect(screen.queryByText('Empresa ABC')).not.toBeInTheDocument()
  })

  it('should update NIT/RUC when switching from clienteA to clienteB (AC#6)', async () => {
    // GIVEN: rendered with clienteA
    const { rerender } = renderWithProviders(
      <ClienteDetailView clienteId={CLIENT_A_ID} />
    )

    await waitFor(() => {
      expect(screen.getByText('900123456-7')).toBeInTheDocument()
    })

    // WHEN: clienteId changes to clienteB
    rerender(
      <QueryClientProvider client={makeQueryClient()}>
        <ClienteDetailView clienteId={CLIENT_B_ID} />
      </QueryClientProvider>
    )

    // THEN: clienteB's NIT is displayed
    await waitFor(() => {
      expect(screen.getByText('800987654-1')).toBeInTheDocument()
    })
  })
})
