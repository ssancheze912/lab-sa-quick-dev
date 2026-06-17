/**
 * Story 2.2: Client Detail View — Component Tests
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level — Vitest + RTL + MSW)
 * These tests FAIL until the implementation is complete.
 *
 * Test IDs covered:
 *   TC-E2-P1-07 — Render ClienteDetailView with valid clienteId; all 4 fields visible
 *   TC-E2-P1-09 — Render ClienteDetailView with non-existent clienteId; MSW 404 → not-found message
 *   Skeleton    — Skeleton is visible while MSW is pending; disappears after response
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factories
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 0
function uniqueSuffix() {
  return `${Date.now()}-${++_counter}`
}

function buildClienteDto(overrides?: Partial<Cliente>): Cliente {
  const suffix = uniqueSuffix()
  return {
    id: crypto.randomUUID(),
    nombre: `Empresa Test ${suffix}`,
    nitRuc: `900${suffix.slice(-6).padStart(6, '0')}-1`,
    telefono: `300${suffix.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup — intercepts GET /api/v1/clientes/:id
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a fresh QueryClient per test — ensures test isolation.
 * Disables retries and gcTime so MSW responses and errors resolve immediately.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

/**
 * Renders ClienteDetailView wrapped in required providers.
 */
function renderClienteDetailView(clienteId: string) {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-07 (Component): Render ClienteDetailView with valid clienteId
// MSW returns full client object → all 4 fields visible in the DOM
// AC1, AC2: Detail panel shows Nombre, NIT/RUC, Teléfono, Ciudad
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-07 — ClienteDetailView with valid clienteId shows all 4 fields', () => {
  it('should display the client Nombre when MSW returns a valid client', async () => {
    // GIVEN: A client exists and MSW intercepts GET /api/v1/clientes/:id
    const cliente = buildClienteDto({ nombre: 'Empresa Detail Visible S.A.S.' })
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered with the client's ID
    renderClienteDetailView(cliente.id)

    // THEN: The client's Nombre is visible in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Detail Visible S.A.S.')
  })

  it('should display the client NIT/RUC when MSW returns a valid client', async () => {
    // GIVEN: A client with a known NIT/RUC
    const cliente = buildClienteDto({ nitRuc: '900987654-3' })
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id)

    // THEN: The NIT/RUC value is visible in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nitruc')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-nitruc')).toHaveTextContent('900987654-3')
  })

  it('should display the client Teléfono when MSW returns a valid client', async () => {
    // GIVEN: A client with a known Teléfono
    const cliente = buildClienteDto({ telefono: '3219876543' })
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id)

    // THEN: The Teléfono value is visible in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('3219876543')
  })

  it('should display the client Ciudad when MSW returns a valid client', async () => {
    // GIVEN: A client with a known Ciudad
    const cliente = buildClienteDto({ ciudad: 'Manizales' })
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id)

    // THEN: The Ciudad value is visible in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Manizales')
  })

  it('should render a section with aria-label="Detalle del cliente" for WCAG 2.1 AA compliance', async () => {
    // GIVEN: A valid client is returned by MSW
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id)

    // THEN: A region with aria-label "Detalle del cliente" exists (WCAG 2.1 AA)
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /detalle del cliente/i })).toBeInTheDocument()
    })
  })

  it('should render NIT/RUC label as "NIT/RUC" in Spanish (MANDATORY)', async () => {
    // GIVEN: A valid client
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id)

    // THEN: The label "NIT/RUC" is present on screen (Spanish — mandatory)
    await waitFor(() => {
      expect(screen.getByText(/NIT\/RUC/)).toBeInTheDocument()
    })
  })

  it('should render Teléfono label in Spanish (MANDATORY)', async () => {
    // GIVEN: A valid client
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id)

    // THEN: The label "Teléfono" is present on screen (Spanish — mandatory)
    await waitFor(() => {
      expect(screen.getByText(/teléfono/i)).toBeInTheDocument()
    })
  })

  it('should render Ciudad label in Spanish (MANDATORY)', async () => {
    // GIVEN: A valid client
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id)

    // THEN: The label "Ciudad" is present on screen (Spanish — mandatory)
    await waitFor(() => {
      expect(screen.getByText(/ciudad/i)).toBeInTheDocument()
    })
  })

  it('should use <dl> semantic markup for field-value pairs (WCAG 2.1 AA)', async () => {
    // GIVEN: A valid client
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    const { container } = renderClienteDetailView(cliente.id)

    // THEN: A <dl> element exists in the rendered output (semantic markup requirement)
    await waitFor(() => {
      expect(container.querySelector('dl')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-09: Render ClienteDetailView with non-existent clienteId
// MSW returns 404 → not-found message visible, no JS error thrown
// AC3: Graceful not-found state
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-09 — ClienteDetailView with non-existent clienteId shows not-found message', () => {
  it('should display a not-found message when MSW returns HTTP 404', async () => {
    // GIVEN: MSW returns 404 Problem Details for the given clienteId
    const nonExistentId = 'nonexistent-id-00000000-0000-0000'
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          {
            status: 404,
            title: 'Cliente no encontrado',
            detail: 'No existe un cliente con el ID especificado.',
          },
          { status: 404 }
        )
      )
    )

    // WHEN: ClienteDetailView is rendered with the non-existent clienteId
    renderClienteDetailView(nonExistentId)

    // THEN: A not-found message element is visible in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
  })

  it('should display the Spanish not-found message text when MSW returns HTTP 404', async () => {
    // GIVEN: MSW returns 404 for the given clienteId
    const nonExistentId = 'nonexistent-id-11111111-1111-1111'
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          {
            status: 404,
            title: 'Cliente no encontrado',
            detail: 'No existe un cliente con el ID especificado.',
          },
          { status: 404 }
        )
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(nonExistentId)

    // THEN: The not-found message in Spanish is visible
    await waitFor(() => {
      expect(
        screen.getByText(/no se encontró el cliente solicitado/i)
      ).toBeInTheDocument()
    })
  })

  it('should NOT display client fields (Nombre, NIT/RUC, Teléfono, Ciudad) when MSW returns 404', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = 'nonexistent-id-22222222-2222-2222'
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado' },
          { status: 404 }
        )
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(nonExistentId)

    // THEN: The not-found state renders
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })

    // THEN: None of the client data fields are in the DOM
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nitruc')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-telefono')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-ciudad')).not.toBeInTheDocument()
  })

  it('should NOT display the error retry panel when MSW returns 404 (404 is not a retryable error)', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = 'nonexistent-id-33333333-3333-3333'
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado' },
          { status: 404 }
        )
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(nonExistentId)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })

    // THEN: The generic ErrorPanel (with Reintentar) is NOT displayed — 404 is a not-found state, not a generic error
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  it('should NOT throw an unhandled error when MSW returns 404 (no console.error about unhandled rejection)', async () => {
    // GIVEN: Track console.error calls for unhandled errors
    const originalConsoleError = console.error
    const consoleErrors: string[] = []
    console.error = (...args: unknown[]) => {
      consoleErrors.push(args.join(' '))
    }

    const nonExistentId = 'nonexistent-id-44444444-4444-4444'
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado' },
          { status: 404 }
        )
      )
    )

    // WHEN: ClienteDetailView is rendered with a non-existent ID
    renderClienteDetailView(nonExistentId)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })

    // THEN: No React unhandled error boundary errors triggered
    const reactErrors = consoleErrors.filter(
      (msg) => msg.includes('Unhandled') || msg.includes('uncaught') || msg.includes('Cannot read')
    )
    expect(reactErrors).toHaveLength(0)

    // Restore console.error
    console.error = originalConsoleError
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Loading Tests
// Skeleton is visible while MSW is pending; disappears after response renders
// ─────────────────────────────────────────────────────────────────────────────

describe('Skeleton loading — ClienteDetailView shows skeleton while fetching', () => {
  it('should render skeleton placeholders while the API request is in-flight', async () => {
    // GIVEN: A delayed MSW handler that keeps the request pending briefly
    const cliente = buildClienteDto()
    let resolveRequest: (value: unknown) => void

    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        // Delay resolution so we can assert the skeleton while in-flight
        await new Promise((resolve) => { resolveRequest = resolve })
        return HttpResponse.json(cliente, { status: 200 })
      })
    )

    // WHEN: ClienteDetailView is rendered (request is in-flight)
    renderClienteDetailView(cliente.id)

    // THEN: Skeleton placeholder is visible immediately (before the response arrives)
    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument()

    // Resolve the pending request so the test can clean up
    resolveRequest!(undefined)
  })

  it('should hide the skeleton and display client data after MSW responds', async () => {
    // GIVEN: MSW returns a valid client
    const cliente = buildClienteDto({ nombre: 'Empresa Skeleton Final S.A.' })
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered and the request resolves
    renderClienteDetailView(cliente.id)

    // THEN: Skeleton disappears and client Nombre is visible
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Skeleton Final S.A.')
  })

  it('should NOT render a spinner — only skeleton placeholders are allowed (anti-pattern guard)', async () => {
    // GIVEN: A delayed MSW handler
    const cliente = buildClienteDto()
    let resolveRequest: (value: unknown) => void

    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        await new Promise((resolve) => { resolveRequest = resolve })
        return HttpResponse.json(cliente, { status: 200 })
      })
    )

    // WHEN: ClienteDetailView is rendered while in-flight
    renderClienteDetailView(cliente.id)

    // THEN: No spinner/role="progressbar" elements exist — skeleton is the only allowed loading indicator
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()

    // Resolve the pending request
    resolveRequest!(undefined)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel shown for non-404 network errors (generic error state)
// ─────────────────────────────────────────────────────────────────────────────

describe('Generic network error — ClienteDetailView shows ErrorPanel with retry', () => {
  it('should render ErrorPanel when MSW returns a 500 server error', async () => {
    // GIVEN: MSW simulates a server error (500)
    const clienteId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(clienteId)

    // THEN: ErrorPanel (with Reintentar button) is shown
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('should render ErrorPanel with Reintentar button when API call fails with a network error', async () => {
    // GIVEN: MSW simulates a network-level error
    const clienteId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.error()
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(clienteId)

    // THEN: ErrorPanel with Reintentar button is visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })
  })

  it('should NOT display the not-found message when the error is NOT a 404', async () => {
    // GIVEN: MSW simulates a 503 server error
    const clienteId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json({ status: 503, title: 'Service Unavailable' }, { status: 503 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(clienteId)

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // THEN: The not-found message is NOT displayed for non-404 errors
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })
})
