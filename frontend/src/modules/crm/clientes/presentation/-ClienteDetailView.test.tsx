/**
 * Story 2.2: Client Detail View
 * Component Tests — ClienteDetailView (Vitest + RTL + MSW)
 *
 * Test Cases Covered:
 *   TC-E2-P1-06a — Click on client item in list → right panel shows Nombre, NIT/RUC, Teléfono, Ciudad
 *   TC-E2-P1-06b — Click on client item → URL updates to /clientes/{clienteId} (no page reload)
 *   TC-E2-P1-08a — Navigate to /clientes/00000000-... → "Cliente no encontrado" message in right panel
 *   TC-E2-P1-08b — Navigate to invalid id → no unhandled JS error, navigation shell still visible
 *   Skeleton loading state — skeleton rows rendered while loading, no role="status" spinner
 *   data-testid="cliente-detail-panel" present on container
 *   data-testid="cliente-not-found" present when 404
 *
 * RED Phase: All tests fail until ClienteDetailView and its dependencies are implemented.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { ClienteDetailView } from './ClienteDetailView'

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ID = 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000'

const mockCliente = {
  id: TEST_ID,
  nombre: 'Empresa Detalle SA',
  nitRuc: '900111222',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup (network-first: intercepts before navigation)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('/api/v1/clientes/:id', ({ params }) => {
    if (params.id === NON_EXISTENT_ID) {
      return new HttpResponse(
        JSON.stringify({ status: 404, title: 'Cliente no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
      )
    }
    if (params.id === TEST_ID) {
      return HttpResponse.json(mockCliente)
    }
    return new HttpResponse(null, { status: 404 })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Render ClienteDetailView with fresh QueryClient per test
// ─────────────────────────────────────────────────────────────────────────────

function renderDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteDetailView, { clienteId })
    )
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06a: Right panel shows all four client fields after load
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-06a — Right panel shows complete client details', () => {
  it('[P1] Given MSW returns a client, When ClienteDetailView renders, Then Nombre is displayed', async () => {
    // GIVEN: MSW returns mockCliente for TEST_ID
    renderDetailView(TEST_ID)

    // WHEN: Component loads and query resolves
    // THEN: Nombre value is visible
    await waitFor(() => {
      expect(screen.getByText('Empresa Detalle SA')).toBeInTheDocument()
    })
  })

  it('[P1] Given MSW returns a client, When ClienteDetailView renders, Then NIT/RUC is displayed', async () => {
    // GIVEN: MSW returns mockCliente for TEST_ID
    renderDetailView(TEST_ID)

    // WHEN: Component loads
    // THEN: NIT/RUC value is visible
    await waitFor(() => {
      expect(screen.getByText('900111222')).toBeInTheDocument()
    })
  })

  it('[P1] Given MSW returns a client, When ClienteDetailView renders, Then Teléfono is displayed', async () => {
    // GIVEN: MSW returns mockCliente for TEST_ID
    renderDetailView(TEST_ID)

    // WHEN: Component loads
    // THEN: Teléfono value is visible
    await waitFor(() => {
      expect(screen.getByText('3001234567')).toBeInTheDocument()
    })
  })

  it('[P1] Given MSW returns a client, When ClienteDetailView renders, Then Ciudad is displayed', async () => {
    // GIVEN: MSW returns mockCliente for TEST_ID
    renderDetailView(TEST_ID)

    // WHEN: Component loads
    // THEN: Ciudad value is visible
    await waitFor(() => {
      expect(screen.getByText('Bogotá')).toBeInTheDocument()
    })
  })

  it('[P1] Given MSW returns a client, When data is loaded, Then all field labels are in Spanish', async () => {
    // GIVEN: MSW returns mockCliente for TEST_ID
    renderDetailView(TEST_ID)

    // WHEN: Data is displayed
    // THEN: All field labels are present in Spanish
    await waitFor(() => {
      expect(screen.getByText('Empresa Detalle SA')).toBeInTheDocument()
    })
    expect(screen.getByText(/NIT\/RUC/i)).toBeInTheDocument()
    expect(screen.getByText(/Teléfono/i)).toBeInTheDocument()
    expect(screen.getByText(/Ciudad/i)).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// data-testid contract: cliente-detail-panel
// ─────────────────────────────────────────────────────────────────────────────

describe('data-testid="cliente-detail-panel" on container', () => {
  it('[P1] Given any state, When ClienteDetailView mounts, Then outer container has data-testid="cliente-detail-panel"', async () => {
    // GIVEN: MSW returns a client
    renderDetailView(TEST_ID)

    // WHEN: Component mounts
    // THEN: The outer container has the required testid
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })

  it('[P1] Given 404 response, When ClienteDetailView renders not-found state, Then container still has data-testid="cliente-detail-panel"', async () => {
    // GIVEN: MSW returns 404 for non-existent id
    renderDetailView(NON_EXISTENT_ID)

    // WHEN: 404 error is received
    // THEN: Panel container is still present with the testid
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-08a: Graceful 404 — "Cliente no encontrado" message
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-08a — 404 not-found renders graceful message', () => {
  it('[P1] Given clienteId does not exist in system, When GET returns 404, Then "Cliente no encontrado" message is displayed', async () => {
    // GIVEN: MSW returns 404 application/problem+json for NON_EXISTENT_ID
    renderDetailView(NON_EXISTENT_ID)

    // WHEN: 404 response is received
    // THEN: User-friendly not-found message is shown in Spanish
    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()
    })
  })

  it('[P1] Given clienteId does not exist, When GET returns 404, Then data-testid="cliente-not-found" is present', async () => {
    // GIVEN: MSW returns 404 for non-existent client
    renderDetailView(NON_EXISTENT_ID)

    // WHEN: 404 state renders
    // THEN: Element with data-testid="cliente-not-found" is present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
  })

  it('[P1] Given clienteId does not exist, When 404 is displayed, Then the "Cliente no encontrado" text is inside the not-found element', async () => {
    // GIVEN: MSW returns 404
    renderDetailView(NON_EXISTENT_ID)

    // WHEN: Not-found state renders
    // THEN: The testid element contains the expected message text
    await waitFor(() => {
      const notFoundEl = screen.getByTestId('cliente-not-found')
      expect(notFoundEl.textContent).toContain('Cliente no encontrado')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-08b: Application shell remains visible, no unhandled JS error
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-08b — No crash on 404, navigation context preserved', () => {
  it('[P1] Given GET returns 404, When component renders, Then no ErrorPanel crash is thrown', async () => {
    // GIVEN: MSW returns 404
    // WHEN: Component renders with non-existent id
    // THEN: Component renders without throwing (no unhandled error boundary triggered)
    expect(() => renderDetailView(NON_EXISTENT_ID)).not.toThrow()
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })

  it('[P1] Given GET returns 404, When component renders, Then generic ErrorPanel is NOT shown (404 is handled specifically)', async () => {
    // GIVEN: MSW returns 404 for non-existent client
    renderDetailView(NON_EXISTENT_ID)

    // WHEN: 404 is received
    // THEN: Generic error panel is NOT rendered — 404 has its own not-found message
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  it('[P1] Given GET returns 404, When not-found state is shown, Then the detail panel container is still rendered', async () => {
    // GIVEN: MSW returns 404
    renderDetailView(NON_EXISTENT_ID)

    // WHEN: 404 state
    // THEN: The outer panel (application frame) is still present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Skeleton loading state — no spinner while fetching
// ─────────────────────────────────────────────────────────────────────────────

describe('Skeleton loading state — no spinner while GET is in-flight', () => {
  it('[P1] Given GET is in-flight, When component first renders, Then no role="status" spinner is present', async () => {
    // GIVEN: MSW handler delays response — component is in loading state
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 60))
        return HttpResponse.json(mockCliente)
      })
    )

    renderDetailView(TEST_ID)

    // WHEN: Component is in loading state before data arrives
    // THEN: No spinner (role="status") — company standard mandates skeleton, not spinner
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // Clean up: wait for data
    await waitFor(() => {
      expect(screen.getByText('Empresa Detalle SA')).toBeInTheDocument()
    })
  })

  it('[P1] Given GET is in-flight, When loading, Then data-testid="cliente-detail-panel" is already present', async () => {
    // GIVEN: MSW handler delays response
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 60))
        return HttpResponse.json(mockCliente)
      })
    )

    renderDetailView(TEST_ID)

    // WHEN: Component is in loading state
    // THEN: The panel container is immediately present (skeleton shown inside it)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })

    // Wait for data to resolve
    await waitFor(() => {
      expect(screen.getByText('Empresa Detalle SA')).toBeInTheDocument()
    })
  })

  it('[P1] Given GET is in-flight, When loading, Then client data fields are NOT visible yet', async () => {
    // GIVEN: MSW handler delays response — still in loading state
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(mockCliente)
      })
    )

    renderDetailView(TEST_ID)

    // WHEN: Loading state (before data arrives)
    // THEN: Client fields are not yet in the DOM
    expect(screen.queryByText('Empresa Detalle SA')).not.toBeInTheDocument()
    expect(screen.queryByText('900111222')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 structural: Nombre label rendered as <dt>Nombre</dt>
// ─────────────────────────────────────────────────────────────────────────────

describe('Detail card structural rendering', () => {
  it('[P1] Given data is loaded, When ClienteDetailView renders, Then Nombre label is "Nombre" (Spanish)', async () => {
    // GIVEN: MSW returns the client
    renderDetailView(TEST_ID)

    // WHEN: Data is loaded
    // THEN: The "Nombre" label is displayed (labels must be in Spanish per story constraint)
    await waitFor(() => {
      expect(screen.getByText('Empresa Detalle SA')).toBeInTheDocument()
    })
    expect(screen.getByText('Nombre')).toBeInTheDocument()
  })

  it('[P1] Given data is loaded, When rendered, Then no "not found" element is shown for an existing client', async () => {
    // GIVEN: MSW returns the client successfully
    renderDetailView(TEST_ID)

    // WHEN: Data is loaded
    // THEN: Not-found element is absent
    await waitFor(() => {
      expect(screen.getByText('Empresa Detalle SA')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })
})
